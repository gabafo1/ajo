CREATE TYPE "public"."plan" AS ENUM('free', 'basic', 'premium');--> statement-breakpoint
CREATE TYPE "public"."subscription_type" AS ENUM('monthly', 'yearly');--> statement-breakpoint
CREATE TABLE "kyc" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"group_name" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"bvn" text,
	"nin" text,
	"phone" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subscriptions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"startDate" date NOT NULL,
	"endDate" date,
	"type" "subscription_type" NOT NULL,
	"plan" "plan" DEFAULT 'free' NOT NULL
);
