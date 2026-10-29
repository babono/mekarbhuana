import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ADD COLUMN "legacy_member_id" numeric;
  ALTER TABLE "users" ADD COLUMN "legacy_password_hash" varchar;
  ALTER TABLE "users" ADD COLUMN "legacy_needs_review" boolean DEFAULT false;
  CREATE INDEX "users_legacy_member_id_idx" ON "users" USING btree ("legacy_member_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "users_legacy_member_id_idx";
  ALTER TABLE "users" DROP COLUMN "legacy_member_id";
  ALTER TABLE "users" DROP COLUMN "legacy_password_hash";
  ALTER TABLE "users" DROP COLUMN "legacy_needs_review";`)
}
