// Prints the welcome email as HTML so you can open it in a browser:
//   npm run email:preview > welcome-preview.html          (then open the file)
//   npm run email:preview -- "Ada Lovelace" ada@example.com > welcome-preview.html
// Images load from the local dev server by default; set EMAIL_ASSET_BASE=https://poolit.site to use the live ones.
import { renderWelcomeEmail } from '../api/_lib/welcome-email.js';

const [name = 'Ada Lovelace', email = 'ada@example.com'] = process.argv.slice(2);
const { html } = renderWelcomeEmail({
  name,
  email,
  referralUrl: 'https://poolit.site/?ref=3fa9c2e1',
  assetBase: process.env.EMAIL_ASSET_BASE || 'http://localhost:3000'
});
process.stdout.write(html);
