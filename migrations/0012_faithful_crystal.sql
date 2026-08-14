ALTER TABLE "groups" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "groups" ALTER COLUMN "contribution_amount" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "groups" ALTER COLUMN "contribution_amount" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "groups" ALTER COLUMN "max_members" SET DEFAULT 10;--> statement-breakpoint
ALTER TABLE "groups" ALTER COLUMN "max_members" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "groups_owner_idx" ON "groups" USING btree ("owner_id");--> statement-breakpoint
ALTER TABLE "groups" DROP COLUMN "role";