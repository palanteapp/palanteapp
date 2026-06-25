// Text-to-speech proxy — twin of anthropic-proxy.
// Locks the model + caps input length server-side so neither can be inflated by
// a tampered client, then forwards to OpenAI's speech endpoint and streams the
// audio back. The OpenAI key never leaves the server (Supabase secret).

const OPENAI_TTS_URL = 'https://api.openai.com/v1/audio/speech'
const ALLOWED_MODEL = 'gpt-4o-mini-tts'

// Cost is driven by input character count, so cap it. A partner reply is bounded
// by the chat output cap (~500 tokens ≈ 2000 chars); refuse anything past that.
const MAX_INPUT_CHARS = 2000

// Only allow the warm, friend-like voices we've vetted. Anything else → default.
const ALLOWED_VOICES = new Set(['coral', 'sage', 'shimmer', 'nova', 'alloy', 'ballad'])
const DEFAULT_VOICE = 'nova'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// In-memory sliding window: 30 requests per minute per IP. Resets on cold start
// but stops burst abuse within an active instance.
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_MAX = 30
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

  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server misconfiguration: no API key' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const body = await req.json().catch(() => null)
  const input = typeof body?.input === 'string' ? body.input.slice(0, MAX_INPUT_CHARS) : ''
  if (!input.trim()) {
    return new Response(JSON.stringify({ error: 'Missing input text' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const voice = ALLOWED_VOICES.has(body?.voice) ? body.voice : DEFAULT_VOICE
  const instructions = typeof body?.instructions === 'string'
    ? body.instructions.slice(0, 500)
    : 'Speak warmly, gently, and unhurried — like a caring friend who genuinely wants this person to feel supported.'

  // ── Enforce model + caps — never trust client values ──────────────────────
  const safeBody = {
    model: ALLOWED_MODEL,
    input,
    voice,
    instructions,
    response_format: 'mp3',
  }

  const upstream = await fetch(OPENAI_TTS_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(safeBody),
  })

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => 'upstream error')
    return new Response(JSON.stringify({ error: 'TTS upstream failed', detail: errText }), {
      status: upstream.status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  // Stream the audio bytes straight back to the client.
  return new Response(upstream.body, {
    status: 200,
    headers: { ...cors, 'Content-Type': 'audio/mpeg' },
  })
})
