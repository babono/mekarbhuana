import { siteUrl } from './siteUrl'

const escape = (value: string) => value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

/**
 * The password-reset message. Plain markup with inline styles, since mail
 * clients ignore stylesheets; the link goes to the site's own reset page rather
 * than Payload's admin screen, so readers never land in the admin panel.
 */
export const resetEmailHTML = ({ token, name }: { token: string; name?: string | null }) => {
  const link = `${siteUrl()}/reset-password?token=${encodeURIComponent(token)}`
  const greeting = name ? `Hello ${escape(name)},` : 'Hello,'

  return `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:#f6f1e7;font-family:Georgia,serif;color:#2b211a">
    <div style="max-width:520px;margin:0 auto;background:#fffdf8;padding:36px 32px;border-top:4px solid #9b2b22">
      <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#8a6d3b">Mekar Bhuana Centre</p>
      <h1 style="margin:0 0 22px;font-size:26px;font-weight:normal">Reset your password</h1>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7">${greeting}</p>
      <p style="margin:0 0 26px;font-size:16px;line-height:1.7">
        Someone — hopefully you — asked to reset the password for your Mekar Bhuana reading account.
        Choose a new one with the button below. The link works for one hour.
      </p>
      <p style="margin:0 0 28px">
        <a href="${link}" style="display:inline-block;background:#9b2b22;color:#fffdf8;text-decoration:none;padding:14px 26px;font-size:14px;letter-spacing:0.12em;text-transform:uppercase">Choose a new password</a>
      </p>
      <p style="margin:0 0 10px;font-size:14px;line-height:1.7;color:#6b5a4b">
        If the button does not work, copy this address into your browser:<br>
        <a href="${link}" style="color:#9b2b22;word-break:break-all">${link}</a>
      </p>
      <p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#6b5a4b">
        If you did not ask for this, you can ignore this email — your password stays as it is.
      </p>
    </div>
  </body>
</html>`
}
