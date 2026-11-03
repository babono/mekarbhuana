import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Payment settings, holding the rate a dollar-priced plan is charged at.
 *
 * Seeded at 18,000 rupiah to the dollar — the rate the English plans were
 * entered in IDR at (IDR 135.000 = USD 7.50). The plans themselves are not
 * converted here: preview builds may run migrations against the production
 * database, where the code still live would refuse a dollar-priced plan at
 * checkout. They are switched to USD in the admin once this has deployed.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payment_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"usd_to_idr" numeric DEFAULT 18000 NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );

  INSERT INTO "payment_settings" ("usd_to_idr", "updated_at", "created_at")
  VALUES (18000, now(), now());`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payment_settings" CASCADE;`)
}
