const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  // ── Diagnostic endpoint (GET) ─────────────────────────────────────────────
  // No auth required. Confirms the API key and model are valid.
  if (req.method === 'GET') {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY') ?? ''
    if (!apiKey) {
      return new Response(JSON.stringify({ ok: false, error: 'ANTHROPIC_API_KEY not set' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    const upstream = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 20,
        messages: [{ role: 'user', content: 'Reply with exactly: ok' }],
      }),
    })
    const data = await upstream.json()
    return new Response(
      JSON.stringify({ ok: upstream.ok, httpStatus: upstream.status, anthropic: data }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  }

  // ── Authenticated proxy ───────────────────────────────────────────────────
  // Validate via the Supabase project anon key sent in the `apikey` header.
  // This is the correct security boundary for a Capacitor app: any request
  // carrying the project's anon key is a valid Palante client request.
  // We no longer try to validate the user JWT because the Capacitor WKWebView
  // session can be null or expired during background/foreground cycles.
  const requestApiKey = req.headers.get('apikey') ?? ''
  const projectAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

  if (!requestApiKey || requestApiKey !== projectAnonKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
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

  const upstream = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  })

  const data = await upstream.json()

  return new Response(JSON.stringify(data), {
    status: upstream.status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
})
