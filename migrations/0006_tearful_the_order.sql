CREATE TABLE "group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"subscription_id" integer NOT NULL,
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"group_id" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "contributions" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "contributions" ADD COLUMN "group_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "contributions" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "group" ADD CONSTRAINT "group_user_id_subscriptions_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."subscriptions"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group" ADD CONSTRAINT "group_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_user_id_subscriptions_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."subscriptions"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_group_id_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc" ADD CONSTRAINT "kyc_user_id_subscriptions_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."subscriptions"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_contributor_subscriptions_user_id_fk" FOREIGN KEY ("contributor") REFERENCES "public"."subscriptions"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributions" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "contributions" DROP COLUMN "groupId";--> statement-breakpoint
ALTER TABLE "contributions" DROP COLUMN "createdAt";