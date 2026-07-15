CREATE TABLE "test_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"repo_id" varchar(255),
	"repo_name" varchar(255) NOT NULL,
	"repo_owner" varchar(255) NOT NULL,
	"branch" varchar(100) DEFAULT 'main',
	"title" varchar(500) NOT NULL,
	"description" text NOT NULL,
	"type" varchar(100) NOT NULL,
	"priority" varchar(50) NOT NULL,
	"target_route" varchar(500),
	"target_files" jsonb DEFAULT '[]'::jsonb,
	"expected_result" text,
	"browserbase_script" text,
	"status" varchar(100) DEFAULT 'generated',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "repositories" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"repo_id" integer NOT NULL,
	"name" text NOT NULL,
	"full_name" text NOT NULL,
	"private" integer NOT NULL,
	"html_url" text NOT NULL,
	"description" text,
	"owner" text NOT NULL,
	"language" text,
	"default_branch" text NOT NULL,
	"target_domain" varchar DEFAULT 'http://localhost:3000/',
	"global_instruction" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"credits" integer DEFAULT 1000 NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;