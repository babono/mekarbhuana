import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'

import { SEED_PAGES } from '../seed/pages'

// Content, not schema: creates the Terms and Troubleshooting pages where they do
// not exist yet. A page already there is left exactly as staff last saved it.
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const editorConfig = await editorConfigFactory.default({ config: payload.config })

  for (const page of SEED_PAGES) {
    const { totalDocs } = await payload.count({
      collection: 'pages',
      where: { slug: { equals: page.slug } },
      req,
    })
    if (totalDocs > 0) continue

    await payload.create({
      collection: 'pages',
      data: {
        title: page.title,
        slug: page.slug,
        intro: page.intro,
        body: convertMarkdownToLexical({ editorConfig, markdown: page.markdown }),
      },
      req,
      context: { skipRevalidate: true },
    })
  }
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.delete({
    collection: 'pages',
    where: { slug: { in: SEED_PAGES.map((page) => page.slug) } },
    req,
  })
}
