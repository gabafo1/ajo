ALTER TABLE "groups" ADD COLUMN "role" "group_role" DEFAULT 'member' NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_fees" ADD COLUMN "fee_type" "fee_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_fees" DROP COLUMN "feeType";