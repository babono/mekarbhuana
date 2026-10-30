/**
 * The site's public address, for links that leave the site — chiefly the one in
 * a password-reset email.
 *
 * Deliberately not read from the request's Host header: anyone can send a forged
 * Host with a reset request, and the link carrying the reader's token would then
 * point at their server instead of ours.
 */
export const siteUrl = (): string => {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '')
  // Vercel's production domain, set on every deployment of the project.
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  return 'http://localhost:3000'
}
