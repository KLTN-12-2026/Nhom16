const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character])

const normalizeLines = (values = []) => values
  .map((value) => String(value || '').trim())
  .filter(Boolean)

const toneStyles = {
  info: { background: '#eef8f2', border: '#b9e4ca', color: '#08783d' },
  success: { background: '#e9f9f0', border: '#a7dfbd', color: '#08783d' },
  warning: { background: '#fff8e7', border: '#f2d28b', color: '#8a5a00' },
  danger: { background: '#fff1f0', border: '#f1b4b0', color: '#b42318' },
}

const createEmailLayout = ({
  subject,
  preheader,
  eyebrow = 'THÔNG BÁO TỪ TOPCV',
  title,
  fullName,
  paragraphs = [],
  details = [],
  highlight,
  verificationCode,
  action,
  securityNote,
}) => {
  const recipientName = String(fullName || '').trim() || 'bạn'
  const safeParagraphs = normalizeLines(paragraphs)
  const safeDetails = details.filter(({ value }) => String(value || '').trim())
  const tone = toneStyles[highlight?.tone] || toneStyles.info

  const textDetails = safeDetails.map(({ label, value }) => `${label}: ${value}`)
  const text = [
    title,
    '',
    `Xin chào ${recipientName},`,
    '',
    ...safeParagraphs.flatMap((paragraph) => [paragraph, '']),
    ...textDetails,
    textDetails.length ? '' : null,
    highlight?.title,
    highlight?.content,
    highlight ? '' : null,
    verificationCode ? `Mã xác minh: ${verificationCode}` : null,
    verificationCode ? '' : null,
    action?.url ? `${action.label}: ${action.url}` : null,
    action?.expiresIn ? `Thời hạn: ${action.expiresIn}` : null,
    action ? '' : null,
    securityNote ? `Lưu ý bảo mật: ${securityNote}` : null,
    '',
    'Trân trọng,',
    'Đội ngũ TopCV',
    '',
    'Bạn nhận được email này vì địa chỉ email của bạn được dùng cho một tài khoản trên TopCV. Nếu không phải bạn, hãy bỏ qua email này.',
  ].filter((line) => line !== null && line !== undefined).join('\n')

  const paragraphHtml = safeParagraphs
    .map((paragraph) => `<p style="margin:0 0 16px;color:#455568;font-size:16px;line-height:1.65;">${escapeHtml(paragraph)}</p>`)
    .join('')

  const detailsHtml = safeDetails.length
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:22px 0;border-collapse:collapse;border:1px solid #dce8e1;border-radius:12px;overflow:hidden;">${safeDetails.map(({ label, value }) => `<tr><td style="width:36%;padding:12px 16px;background:#f6faf8;border-bottom:1px solid #e5eee9;color:#66776d;font-size:14px;font-weight:700;">${escapeHtml(label)}</td><td style="padding:12px 16px;border-bottom:1px solid #e5eee9;color:#18332a;font-size:14px;font-weight:600;">${escapeHtml(value)}</td></tr>`).join('')}</table>`
    : ''

  const highlightHtml = highlight
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:22px 0;border-collapse:separate;"><tr><td style="padding:16px 18px;background:${tone.background};border:1px solid ${tone.border};border-radius:12px;color:${tone.color};"><div style="font-size:14px;font-weight:800;margin-bottom:5px;">${escapeHtml(highlight.title)}</div><div style="font-size:15px;line-height:1.6;white-space:pre-line;">${escapeHtml(highlight.content)}</div></td></tr></table>`
    : ''

  const verificationCodeHtml = verificationCode
    ? `<div style="margin:24px 0;padding:18px;text-align:center;background:#f2faf5;border:1px dashed #69c990;border-radius:12px;color:#08783d;font-size:32px;font-weight:800;letter-spacing:8px;">${escapeHtml(verificationCode)}</div>`
    : ''

  const actionHtml = action?.url
    ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:26px 0 18px;"><tr><td style="border-radius:10px;background:#00a84f;"><a href="${escapeHtml(action.url)}" target="_blank" style="display:inline-block;padding:14px 24px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:800;">${escapeHtml(action.label)}</a></td></tr></table><p style="margin:0 0 10px;color:#68786f;font-size:13px;line-height:1.55;">Nếu nút không hoạt động, hãy sao chép liên kết sau vào trình duyệt:</p><p style="margin:0 0 20px;word-break:break-all;color:#08783d;font-size:13px;line-height:1.55;">${escapeHtml(action.url)}</p>${action.expiresIn ? `<p style="margin:0 0 20px;color:#8a5a00;font-size:14px;font-weight:700;">Liên kết có hiệu lực trong ${escapeHtml(action.expiresIn)}.</p>` : ''}`
    : ''

  const securityHtml = securityNote
    ? `<div style="margin-top:24px;padding:14px 16px;background:#f7f8fa;border-left:4px solid #8d9a92;color:#59675f;font-size:13px;line-height:1.6;"><strong style="color:#33453b;">Lưu ý bảo mật:</strong> ${escapeHtml(securityNote)}</div>`
    : ''

  const html = `<!doctype html>
<html lang="vi">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f3f7f5;font-family:Arial,Helvetica,sans-serif;color:#17233c;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader || subject)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f7f5;"><tr><td align="center" style="padding:32px 12px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #dce8e1;border-radius:18px;overflow:hidden;box-shadow:0 8px 28px rgba(23,51,42,.08);">
      <tr><td style="height:6px;background:#00b14f;font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td style="padding:26px 34px 20px;border-bottom:1px solid #e7efeb;">
        <div style="font-size:28px;font-weight:900;letter-spacing:-1.5px;color:#17233c;">top<span style="color:#00b14f;">CV</span></div>
        <div style="margin-top:5px;color:#77867e;font-size:12px;">Tiếp lợi thế, nối thành công</div>
      </td></tr>
      <tr><td style="padding:32px 34px;">
        <div style="margin-bottom:10px;color:#008f40;font-size:12px;font-weight:800;letter-spacing:1.4px;">${escapeHtml(eyebrow)}</div>
        <h1 style="margin:0 0 22px;color:#17233c;font-size:27px;line-height:1.25;">${escapeHtml(title)}</h1>
        <p style="margin:0 0 18px;color:#263b31;font-size:16px;line-height:1.6;">Xin chào <strong>${escapeHtml(recipientName)}</strong>,</p>
        ${paragraphHtml}${detailsHtml}${highlightHtml}${verificationCodeHtml}${actionHtml}${securityHtml}
      </td></tr>
      <tr><td style="padding:22px 34px;background:#f7faf8;border-top:1px solid #e7efeb;color:#718078;font-size:12px;line-height:1.65;">
        <strong style="color:#3b5145;">Đội ngũ TopCV</strong><br>
        Bạn nhận được email này vì địa chỉ email của bạn được dùng cho một tài khoản trên TopCV. Nếu không phải bạn, hãy bỏ qua email này.
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`

  return { subject, text, html }
}

module.exports = { createEmailLayout, escapeHtml }
