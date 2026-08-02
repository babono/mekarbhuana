/**
 * Copies the pdf.js worker into `public/` so the flipbook can load it from a
 * stable URL.
 *
 * pdf.js runs its parser in a Web Worker, which has to be fetched at runtime
 * rather than bundled into the page. Resolving it through `new URL(...,
 * import.meta.url)` leaves it at the mercy of whichever bundler is in play;
 * copying it to a fixed path keeps dev, `next build` and Vercel identical.
 *
 * Runs on `postinstall` and again on `prebuild`, so the copy can never drift
 * from the installed pdfjs-dist version. The copy itself is gitignored.
 */
import { copyFile, mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)

const source = path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'build', 'pdf.worker.min.mjs')
const destination = path.join(process.cwd(), 'public', 'pdf.worker.min.mjs')

await mkdir(path.dirname(destination), { recursive: true })
await copyFile(source, destination)

console.log(`pdf.js worker → ${path.relative(process.cwd(), destination)}`)
