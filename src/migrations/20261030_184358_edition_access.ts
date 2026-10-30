import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ADD COLUMN "english_access_until" timestamp(3) with time zone;
  ALTER TABLE "users" ADD COLUMN "indonesian_access_until" timestamp(3) with time zone;`)

  // Fill each reader's windows from their live subscriptions, as syncMembership
  // would: the furthest-out active term in each edition.
  await db.execute(sql`
   UPDATE "users" u SET
     "english_access_until" = (
       SELECT max(s."expires_at") FROM "subscriptions" s
       WHERE s."user_id" = u."id" AND s."status" = 'active' AND s."edition" = 'en' AND s."expires_at" > now()),
     "indonesian_access_until" = (
       SELECT max(s."expires_at") FROM "subscriptions" s
       WHERE s."user_id" = u."id" AND s."status" = 'active' AND s."edition" = 'id' AND s."expires_at" > now());`)

  await db.execute(sql`
   ALTER TABLE "users" DROP COLUMN "membership_edition";
  DROP TYPE "public"."enum_users_membership_edition";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_membership_edition" AS ENUM('en', 'id');
  ALTER TABLE "users" ADD COLUMN "membership_edition" "enum_users_membership_edition";
  ALTER TABLE "users" DROP COLUMN "english_access_until";
  ALTER TABLE "users" DROP COLUMN "indonesian_access_until";`)
}
