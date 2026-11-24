// The PoolIt welcome email, sent when someone joins the waitlist.
//
// Email clients cannot run scripts or draw SVG, so the site's artwork reaches the inbox as plain
// image files in /email: an animated GIF of the PoolIt mark with the service tiles, a JPEG of the
// app screens, and PNG logos. The layout is tables with inline styles, which is what mail apps
// agree on; the colours, voice and shapes come from the site. Dark-mode mail apps get a dark
// version through prefers-color-scheme, and the mint and green bands stay the same in both.
//
// The folder name starts with an underscore so Vercel bundles this file with the function that
// imports it instead of serving it as an endpoint.

const SITE = 'https://poolit.site';

export const WELCOME_SUBJECT = "You're on the PoolIt waitlist";

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

// The three points the site makes in its hero, in the same words.
const STEPS = [
  ['Pool with your neighbours', 'Start or join a group for plans that come with spare seats.'],
  ['Automatic monthly shares', 'Link a card once. No chasing anyone for transfers.'],
  ['Clear billing, built-in chat', 'See who has joined, the next billing date, and talk to the group.']
];

export function renderWelcomeEmail({ name, email, referralUrl, assetBase = process.env.EMAIL_ASSET_BASE || SITE }) {
  const first = String(name || '').trim().split(/\s+/)[0] || 'there';
  const firstHtml = escapeHtml(first);
  const emailHtml = escapeHtml(email || '');
  const invite = escapeHtml(referralUrl);
  const img = (file) => `${assetBase.replace(/\/$/, '')}/email/${file}`;

  const text = `Hi ${first},

You're on the PoolIt waitlist. We'll email you the moment PoolIt is ready in your neighbourhood, so you and your friends can Pool it.

WHAT HAPPENS NEXT
${STEPS.map(([title, body], i) => `${i + 1}. ${title}. ${body}`).join('\n')}

PASS THE INVITE ALONG
Know someone you'd share a subscription with? Send them your invite link. Their signup will be connected to yours:
${referralUrl}

Questions? Reply to this email or write to hello@poolit.site.

PoolIt
Split the bill. Keep the stream.
${SITE}
${email ? `\nYou're getting this because ${email} joined the PoolIt waitlist.` : ''}`;

  const steps = STEPS.map(([title, body], i) => `
              <tr>
                <td valign="top" width="52" style="padding:0 0 18px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                    <td class="badge" width="36" height="36" align="center" valign="middle" bgcolor="#E3F2EA" style="width:36px;height:36px;border-radius:18px;background:#E3F2EA;color:#0D6B4E;font-family:'Bricolage Grotesque','DM Sans',Helvetica,Arial,sans-serif;font-size:16px;font-weight:700;line-height:36px;">${i + 1}</td>
                  </tr></table>
                </td>
                <td valign="top" style="padding:0 0 18px;">
                  <p class="t-ink" style="margin:0;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:16px;font-weight:700;line-height:1.35;color:#0E1A15;">${escapeHtml(title)}</p>
                  <p class="t-body" style="margin:4px 0 0;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#405148;">${escapeHtml(body)}</p>
                </td>
              </tr>`).join('');

  const html = `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(WELCOME_SUBJECT)}</title>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
<style>
  :root { color-scheme: light dark; supported-color-schemes: light dark; }
  body { margin:0 !important; padding:0 !important; width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  table, td { border-collapse:collapse; mso-table-lspace:0; mso-table-rspace:0; }
  img { border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
  a { color:#0D6B4E; }
  @media only screen and (max-width:620px) {
    .wrap { width:100% !important; }
    .px { padding-left:22px !important; padding-right:22px !important; }
    .h1 { font-size:34px !important; }
    .fluid { width:100% !important; height:auto !important; }
  }
  @media (prefers-color-scheme: dark) {
    .bg-outer { background:#0C0D0E !important; }
    .bg-card { background:#17191B !important; border-color:#26292C !important; }
    .bg-soft { background:#202326 !important; border-color:#2C3033 !important; }
    .t-ink { color:#F2F3F4 !important; }
    .t-body { color:#C9CFD2 !important; }
    .t-muted { color:#9BA1A6 !important; }
    .t-brand, a.link { color:#3FCF98 !important; }
    .badge { background:#13271F !important; color:#3FCF98 !important; }
    .logo-light { display:none !important; max-height:0 !important; overflow:hidden !important; }
    .logo-dark { display:block !important; max-height:none !important; overflow:visible !important; }
  }
</style>
</head>
<body class="bg-outer" bgcolor="#F3F6F2" style="margin:0;padding:0;background:#F3F6F2;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">You're on the PoolIt waitlist. Here is what happens next.&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-outer" bgcolor="#F3F6F2" style="background:#F3F6F2;">
  <tr>
    <td align="center" style="padding:28px 12px 36px;">
      <table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

        <!-- brand -->
        <tr>
          <td class="px" style="padding:0 4px 16px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
              <td valign="middle" style="padding:0 10px 0 0;">
                <img class="logo-light" src="${img('mark-green.png')}" width="34" height="34" alt="" style="display:block;width:34px;height:34px;">
                <img class="logo-dark" src="${img('mark-white.png')}" width="34" height="34" alt="" style="display:none;max-height:0;overflow:hidden;mso-hide:all;width:34px;height:34px;">
              </td>
              <td valign="middle" class="t-brand" style="font-family:'Bricolage Grotesque','DM Sans',Helvetica,Arial,sans-serif;font-size:24px;font-weight:700;letter-spacing:-0.5px;color:#0D6B4E;">PoolIt</td>
            </tr></table>
          </td>
        </tr>

        <!-- card -->
        <tr>
          <td class="bg-card" bgcolor="#FFFFFF" style="background:#FFFFFF;border:1px solid #E6ECE8;border-radius:20px;overflow:hidden;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

              <!-- animated banner: the PoolIt mark with the services you can pool -->
              <tr>
                <td bgcolor="#0D6B4E" style="background:#0D6B4E;font-size:0;line-height:0;">
                  <img class="fluid" src="${img('welcome-hero.gif')}" width="600" height="280" alt="The PoolIt mark with Netflix, Spotify, YouTube, Canva, Apple Music and Google One floating around it" style="display:block;width:100%;max-width:600px;height:auto;">
                </td>
              </tr>

              <!-- headline and welcome -->
              <tr>
                <td class="px" style="padding:36px 40px 8px;">
                  <h1 class="h1 t-ink" style="margin:0;font-family:'Bricolage Grotesque','DM Sans',Helvetica,Arial,sans-serif;font-size:42px;font-weight:700;line-height:1.08;letter-spacing:-1.4px;color:#0E1A15;">You're on the waitlist<span style="color:#F0A500;">.</span></h1>
                  <p class="t-body" style="margin:22px 0 0;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:17px;line-height:1.65;color:#26362F;">Hi ${firstHtml},</p>
                  <p class="t-body" style="margin:10px 0 0;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:17px;line-height:1.65;color:#26362F;">You're on the PoolIt waitlist. We'll email you the moment PoolIt is ready in your neighbourhood, so you and your friends can Pool it.</p>
                </td>
              </tr>

              <!-- what happens next -->
              <tr>
                <td class="px" style="padding:30px 40px 12px;">
                  <h2 class="t-ink" style="margin:0 0 20px;font-family:'Bricolage Grotesque','DM Sans',Helvetica,Arial,sans-serif;font-size:24px;font-weight:700;line-height:1.15;letter-spacing:-0.6px;color:#0E1A15;">What happens next</h2>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${steps}
                  </table>
                </td>
              </tr>

              <!-- the app -->
              <tr>
                <td bgcolor="#E3F2EA" style="background:#E3F2EA;padding:30px 0 0;">
                  <h2 class="px" style="margin:0 0 4px;padding:0 40px;font-family:'Bricolage Grotesque','DM Sans',Helvetica,Arial,sans-serif;font-size:24px;font-weight:700;line-height:1.15;letter-spacing:-0.6px;color:#0E1A15;text-align:center;">A first look at the app</h2>
                  <img class="fluid" src="${img('welcome-phones.jpg')}" width="600" height="380" alt="Three PoolIt app screens: your groups, a group's members and billing, and creating a new Netflix group" style="display:block;width:100%;max-width:600px;height:auto;border:0;">
                </td>
              </tr>

              <!-- invite -->
              <tr>
                <td class="px" style="padding:34px 40px 40px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-soft" bgcolor="#F3F6F2" style="background:#F3F6F2;border:1px solid #E6ECE8;border-radius:16px;">
                    <tr>
                      <td style="padding:26px 26px 6px;">
                        <h2 class="t-ink" style="margin:0;font-family:'Bricolage Grotesque','DM Sans',Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;line-height:1.15;letter-spacing:-0.5px;color:#0E1A15;">Pass the invite along</h2>
                        <p class="t-body" style="margin:10px 0 0;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#405148;">Know someone you'd share a subscription with? Send them this link. Their signup will be connected to yours.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:16px 26px 8px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                          <td bgcolor="#0D6B4E" style="background:#0D6B4E;border-radius:999px;">
                            <a href="${invite}" style="display:inline-block;padding:16px 28px;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;line-height:1;color:#FFFFFF;text-decoration:none;border-radius:999px;">Share your invite</a>
                          </td>
                        </tr></table>
                      </td>
                    </tr>
                    <tr>
                      <td class="t-muted" style="padding:6px 26px 26px;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5;word-break:break-all;color:#5B6B63;">${invite}</td>
                    </tr>
                  </table>
                </td>
              </tr>

            </table>
          </td>
        </tr>

        <!-- footer -->
        <tr>
          <td class="px" style="padding:24px 8px 0;">
            <p class="t-muted" style="margin:0;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#5B6B63;">Questions? Reply to this email or write to <a class="link" href="mailto:hello@poolit.site" style="color:#0D6B4E;text-decoration:underline;">hello@poolit.site</a>.</p>
            <p class="t-muted" style="margin:14px 0 0;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#5B6B63;">
              <span class="t-ink" style="font-weight:700;color:#0E1A15;">PoolIt</span> · Split the bill. Keep the stream.<br>
              <a class="link" href="${SITE}" style="color:#0D6B4E;text-decoration:underline;">poolit.site</a> &nbsp;·&nbsp;
              <a class="link" href="${SITE}/privacy" style="color:#0D6B4E;text-decoration:underline;">Privacy</a> &nbsp;·&nbsp;
              <a class="link" href="https://x.com/poolitsite" style="color:#0D6B4E;text-decoration:underline;">X</a> &nbsp;·&nbsp;
              <a class="link" href="https://www.instagram.com/poolitsite" style="color:#0D6B4E;text-decoration:underline;">Instagram</a>
            </p>${email ? `
            <p class="t-muted" style="margin:14px 0 0;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#718078;">You're getting this because ${emailHtml} joined the PoolIt waitlist.</p>` : ''}
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  return { subject: WELCOME_SUBJECT, text, html };
}
