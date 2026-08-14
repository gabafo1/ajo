CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"amount" numeric NOT NULL,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"contributor" text NOT NULL,
	"date" timestamp DEFAULT now()
);
