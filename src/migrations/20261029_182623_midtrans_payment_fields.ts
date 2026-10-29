import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "plans" ALTER COLUMN "currency" SET DEFAULT 'IDR';
  ALTER TABLE "subscriptions" ADD COLUMN "payment_order_id" varchar;
  ALTER TABLE "subscriptions" ADD COLUMN "payment_method" varchar;
  ALTER TABLE "subscriptions" ADD COLUMN "payment_url" varchar;
  ALTER TABLE "subscriptions" ADD COLUMN "payment_url_expires_at" timestamp(3) with time zone;
  CREATE INDEX "subscriptions_payment_order_id_idx" ON "subscriptions" USING btree ("payment_order_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "subscriptions_payment_order_id_idx";
  ALTER TABLE "plans" ALTER COLUMN "currency" SET DEFAULT 'USD';
  ALTER TABLE "subscriptions" DROP COLUMN "payment_order_id";
  ALTER TABLE "subscriptions" DROP COLUMN "payment_method";
  ALTER TABLE "subscriptions" DROP COLUMN "payment_url";
  ALTER TABLE "subscriptions" DROP COLUMN "payment_url_expires_at";`)
}
