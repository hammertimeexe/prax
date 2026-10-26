/**
 * The sample-report email. Table layout and inline styles only: that is what
 * email clients render reliably. Brand: black, white, Fire Orange.
 */

const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const MARK = (ink) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>` +
  `<td style="width:13px;height:13px;border:3px solid ${ink};border-right:0;border-bottom:0"></td>` +
  `<td style="width:8px;height:13px;background:#FF3001"></td></tr><tr>` +
  `<td style="width:13px;height:8px;border-left:3px solid ${ink};background:#FF3001"></td>` +
  `<td style="width:8px;height:8px;background:${ink}"></td></tr></table>`

export function sampleReportEmail({ name, siteUrl, demoUrl }) {
  const hi = name ? `Hi ${esc(name)},` : 'Hi,'
  const subject = 'Your Praxis sample report'
  const text = [
    hi,
    '',
    'Here is the sample Praxis report you asked for (attached as a PDF).',
    '',
    'It shows what your team receives for every candidate:',
    '- An overall score, pass mark and recommendation (shortlist, review or reject)',
    '- A skill profile: every skill banded strong, solid, partial or weak, and how far the evidence goes',
    '- Every hidden test, under the skill it proves, and why it passed or failed',
    '- Integrity signals in context: signals, not verdicts',
    '',
    `See it on a call with your own roles: ${demoUrl}`,
    '',
    '— The Praxis team',
    siteUrl,
  ].join('\n')

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f2f1ee">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f1ee;padding:32px 12px">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;font-family:Inter,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0a0a0a">
  <tr><td style="background:#000000;padding:22px 28px">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="vertical-align:middle">${MARK('#ffffff')}</td>
      <td style="vertical-align:middle;padding-left:10px;color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.5px">Praxis<span style="color:#FF3001">.</span></td>
    </tr></table>
  </td></tr>
  <tr><td style="height:4px;background:#FF3001;line-height:4px;font-size:0">&nbsp;</td></tr>
  <tr><td style="padding:32px 28px 8px">
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#FF3001;font-family:'JetBrains Mono',Consolas,monospace">Sample report</p>
    <h1 style="margin:0 0 16px;font-size:28px;line-height:1.15;letter-spacing:-1px;font-weight:800">Hire on proof,<br><span style="color:#8a8a8a">not promises.</span></h1>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6">${hi}</p>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6">Here is the sample Praxis report you asked for. It's attached as a PDF: the same report your team receives for every candidate.</p>
  </td></tr>
  <tr><td style="padding:0 28px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;border-radius:12px">
      <tr><td style="padding:20px 22px;color:#ffffff">
        ${[
          ['Score and recommendation', 'An overall score against your pass mark, and shortlist, review or reject.'],
          ['Skill profile', 'Every skill banded strong, solid, partial or weak, and how far the evidence goes.'],
          ['Every hidden test', 'Under the skill it proves, with why it passed or failed.'],
          ['Integrity signals', 'Tab switches, pastes and full-screen exits, in context. Signals, not verdicts.'],
        ]
          .map(
            ([t, d]) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px"><tr>
              <td style="width:18px;vertical-align:top;padding-top:5px"><div style="width:8px;height:8px;background:#FF3001;border-radius:2px"></div></td>
              <td style="font-size:14px;line-height:1.5"><b>${t}</b><br><span style="color:#a9a6a0">${d}</span></td></tr></table>`,
          )
          .join('')}
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:26px 28px 8px">
    <p style="margin:0 0 18px;font-size:15px;line-height:1.6">Want to see it with your own roles and stacks? We'll walk you through a live assessment and a real report.</p>
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="background:#FF3001;border-radius:999px"><a href="${esc(demoUrl)}" style="display:inline-block;padding:13px 24px;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none">Book a demo &rarr;</a></td>
      <td style="width:10px"></td>
      <td style="border:1px solid #d6d3cd;border-radius:999px"><a href="${esc(siteUrl)}" style="display:inline-block;padding:12px 22px;color:#0a0a0a;font-weight:600;font-size:15px;text-decoration:none">Visit Praxis</a></td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:26px 28px 28px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #ececec"><tr>
      <td style="padding-top:14px;font-size:12px;line-height:1.6;color:#8a8a8a">
        You're receiving this because this address asked for a sample report on the Praxis website. We won't email you again unless you reply.<br>
        Praxis · Skills-based assessment · <a href="${esc(siteUrl)}" style="color:#8a8a8a">${esc(siteUrl.replace(/^https?:\/\//, ''))}</a>
      </td>
    </tr></table>
  </td></tr>
</table>
</td></tr></table>
</body></html>`
  return { subject, text, html }
}

export function leadEmail({ email, name, company, page }) {
  const rows = [
    ['Email', email],
    ['Name', name || '—'],
    ['Company', company || '—'],
    ['From page', page || '—'],
    ['When', new Date().toISOString()],
  ]
  return {
    subject: `Sample report requested: ${email}`,
    text: rows.map(([k, v]) => `${k}: ${v}`).join('\n'),
    html: `<table style="font-family:Arial,sans-serif;font-size:14px">${rows.map(([k, v]) => `<tr><td style="color:#888;padding:4px 12px 4px 0">${k}</td><td>${esc(v)}</td></tr>`).join('')}</table>`,
  }
}
