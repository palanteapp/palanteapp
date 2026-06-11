const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ALLOWED_MODEL = 'claude-haiku-4-5-20251001'
const MAX_TOKENS_CAP = 500

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// In-memory sliding window: 20 requests per minute per IP.
// Resets on cold start but stops burst abuse within an active instance.
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_MAX = 20
const RATE_LIMIT_WINDOW_MS = 60_000

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = (rateLimitMap.get(ip) ?? []).filter(t => now - t < RATE_LIMIT_WINDOW_MS)
  if (timestamps.length >= RATE_LIMIT_MAX) return true
  timestamps.push(now)
  rateLimitMap.set(ip, timestamps)
  return false
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  // ── Auth — all methods require the project anon key ───────────────────────
  const requestApiKey = req.headers.get('apikey') ?? ''
  const projectAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

  if (!requestApiKey || requestApiKey !== projectAnonKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  // ── Rate limiting ─────────────────────────────────────────────────────────
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server misconfiguration: no API key' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const body = await req.json()

  // ── Enforce model and cap max_tokens — never trust client values ──────────
  const safeBody = {
    ...body,
    model: ALLOWED_MODEL,
    max_tokens: Math.min(body.max_tokens ?? MAX_TOKENS_CAP, MAX_TOKENS_CAP),
  }

  const upstream = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(safeBody),
  })

  const data = await upstream.json()

  return new Response(JSON.stringify(data), {
    status: upstream.status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
})
