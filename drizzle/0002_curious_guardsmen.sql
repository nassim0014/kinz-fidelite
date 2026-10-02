CREATE TYPE "public"."locale" AS ENUM('fr', 'tn', 'en', 'ar');--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "locale" "locale" DEFAULT 'fr' NOT NULL;