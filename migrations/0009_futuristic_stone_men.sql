ALTER TABLE "kyc" DROP CONSTRAINT "kyc_group_name_group_id_fk";
--> statement-breakpoint
ALTER TABLE "kyc" ADD COLUMN "group_id" uuid;--> statement-breakpoint
ALTER TABLE "kyc" ADD CONSTRAINT "kyc_group_id_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group"("id") ON DELETE no action ON UPDATE no action;