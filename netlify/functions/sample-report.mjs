import nodemailer from 'nodemailer'
import { leadEmail, sampleReportEmail } from './lib/email.mjs'
import { DEMO_URL } from '../../src/site-config.js'

/**
 * POST /api/sample-report { email, name?, company?, page?, website? }
 * Emails the sample report PDF from the Praxis Gmail account. `website` is a
 * honeypot: people never see it, bots fill it in.
 */

const EMAIL = /^[^\s@<>()[\]\\,;:"]{1,64}@[^\s@<>()[\]\\,;:"]{1,190}\.[a-z]{2,24}$/i
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
const clean = (v, max) => String(v ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max)

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Use POST.' })
  let body
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'Send JSON.' })
  }
  if (body.website) return json(200, { ok: true }) // honeypot: pretend it worked

  const email = clean(body.email, 254)
  if (!EMAIL.test(email)) return json(422, { error: 'Enter a valid work email.' })
  const name = clean(body.name, 80)
  const company = clean(body.company, 120)
  const page = clean(body.page, 200)

  const { SMTP_USER, SMTP_PASS, LEADS_TO } = process.env
  if (!SMTP_USER || !SMTP_PASS) return json(503, { error: 'Email is not set up yet. Please book a demo instead.' })

  const siteUrl = process.env.URL || new URL(req.url).origin
  const pdf = await fetch(`${siteUrl}/praxis-sample-report.pdf`)
  if (!pdf.ok) return json(502, { error: 'The sample report could not be loaded. Try again in a minute.' })
  const attachment = Buffer.from(await pdf.arrayBuffer())

  const transport = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user: SMTP_USER, pass: SMTP_PASS } })
  const from = `Praxis <${SMTP_USER}>`
  const mail = sampleReportEmail({ name, siteUrl, demoUrl: DEMO_URL })
  try {
    await transport.sendMail({
      from,
      to: email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      attachments: [{ filename: 'Praxis sample report.pdf', content: attachment, contentType: 'application/pdf' }],
    })
    if (LEADS_TO) {
      const lead = leadEmail({ email, name, company, page })
      await transport.sendMail({ from, to: LEADS_TO, replyTo: email, ...lead }).catch(() => {})
    }
  } catch (err) {
    console.error('sample-report send failed', err?.message)
    return json(502, { error: 'We could not send the email right now. Try again in a minute.' })
  }
  return json(200, { ok: true })
}

export const config = { path: '/api/sample-report' }
