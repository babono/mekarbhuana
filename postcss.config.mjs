/**
 * Tailwind is only pulled in by `src/app/(frontend)/styles.css`, so the Payload
 * admin panel's own stylesheets pass through untouched.
 */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
