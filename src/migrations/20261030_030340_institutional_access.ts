import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ADD COLUMN "institution_name" varchar;
  ALTER TABLE "users" ADD COLUMN "institution_ips" varchar;`)

  // The University of Kentucky's account, carried over from WordPress. These are
  // their EZproxy servers, as given by their librarian. A third address they
  // listed, 188.92.136.124, is left out: it belongs to OpenAthens, which proxies
  // for many institutions, so allowing it would open the book to all of them.
  await db.execute(sql`
   UPDATE "users"
   SET "institution_name" = 'University of Kentucky',
       "institution_ips" = ${'128.163.2.206\n128.163.188.31'}
   WHERE "email" = 'institutional-uky@balimusicanddance.com' AND "institution_ips" IS NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" DROP COLUMN "institution_name";
  ALTER TABLE "users" DROP COLUMN "institution_ips";`)
}
