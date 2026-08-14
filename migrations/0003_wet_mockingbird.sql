ALTER TABLE "group_members" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "groups" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payouts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "schedules" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "transactions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "group_members" CASCADE;--> statement-breakpoint
DROP TABLE "groups" CASCADE;--> statement-breakpoint
DROP TABLE "payouts" CASCADE;--> statement-breakpoint
DROP TABLE "schedules" CASCADE;--> statement-breakpoint
DROP TABLE "transactions" CASCADE;--> statement-breakpoint
ALTER TABLE "contributions" DROP CONSTRAINT "contributions_member_id_group_members_id_fk";
--> statement-breakpoint
ALTER TABLE "contributions" DROP CONSTRAINT "contributions_group_id_groups_id_fk";
--> statement-breakpoint
ALTER TABLE "kyc" DROP CONSTRAINT "kyc_group_id_groups_id_fk";
--> statement-breakpoint
DROP INDEX "idx_contributions_group_id";--> statement-breakpoint
ALTER TABLE "kyc" ALTER COLUMN "group_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "contributions" ADD COLUMN "userId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "contributions" ADD COLUMN "groupId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "contributions" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "contributions" DROP COLUMN "member_id";--> statement-breakpoint
ALTER TABLE "contributions" DROP COLUMN "group_id";--> statement-breakpoint
ALTER TABLE "contributions" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "kyc" DROP COLUMN "group_id";--> statement-breakpoint
DROP TYPE "public"."transaction_status";--> statement-breakpoint
DROP TYPE "public"."transaction_type";