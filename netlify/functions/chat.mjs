import { SYSTEM_PROMPT } from './lib/knowledge.mjs'

/**
 * POST /api/chat { messages: [{ role: 'user' | 'assistant', content }] }
 * Answers questions about Praxis through OpenRouter. The key stays here, on
 * the server; the page never sees it.
 */

const MAX_TURNS = 12
const MAX_CHARS = 1500
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Use POST.' })
  const key = process.env.OPENROUTER_API_KEY
  if (!key) return json(503, { error: 'not_configured' })

  let body
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'Send JSON.' })
  }
  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }))
  if (!messages.length || messages[messages.length - 1].role !== 'user') return json(422, { error: 'Ask a question.' })

  const siteUrl = process.env.URL || new URL(req.url).origin
  let res
  try {
    res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': siteUrl,
        'X-Title': 'Praxis website',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'openrouter/auto',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        max_tokens: 400,
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(20000),
    })
  } catch {
    return json(504, { error: 'The assistant took too long. Try again.' })
  }
  if (!res.ok) {
    console.error('openrouter', res.status, (await res.text()).slice(0, 300))
    return json(502, { error: 'The assistant is unavailable right now.' })
  }
  const data = await res.json()
  const reply = data?.choices?.[0]?.message?.content?.trim()
  if (!reply) return json(502, { error: 'The assistant had no answer. Try rephrasing.' })
  return json(200, { reply })
}

export const config = { path: '/api/chat' }
