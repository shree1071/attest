CREATE TABLE "audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"reason" text,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"amount" integer NOT NULL,
	"transaction_type" text NOT NULL,
	"reference_testimonial_id" text,
	"reference_request_id" text,
	"description" text,
	"balance_after" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credit_tx_amount_nonzero" CHECK ("credit_transactions"."amount" <> 0),
	CONSTRAINT "credit_tx_balance_nonnegative" CHECK ("credit_transactions"."balance_after" >= 0)
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"website_url" text NOT NULL,
	"category" text DEFAULT 'SaaS' NOT NULL,
	"logo_key" text,
	"slug" text NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"accepting_testimonials" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonial_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"fulfilled_testimonial_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"author_id" text NOT NULL,
	"content" text NOT NULL,
	"rating" integer DEFAULT 5 NOT NULL,
	"source_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"identity_snapshot" text NOT NULL,
	"consent_at" timestamp with time zone NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"withdrawn_at" timestamp with time zone,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text,
	"name" text NOT NULL,
	"headline" text,
	"headline_source" text DEFAULT 'self_reported' NOT NULL,
	"identity_source" text DEFAULT 'demo' NOT NULL,
	"provider" text,
	"provider_subject" text,
	"profile_url" text,
	"avatar_url" text,
	"identity_observed_at" timestamp with time zone,
	"is_admin" boolean DEFAULT false NOT NULL,
	"is_restricted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonial_requests" ADD CONSTRAINT "testimonial_requests_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit_events" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_target_idx" ON "audit_events" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_tx_testimonial_uq" ON "credit_transactions" USING btree ("reference_testimonial_id");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_tx_request_uq" ON "credit_transactions" USING btree ("reference_request_id");--> statement-breakpoint
CREATE INDEX "credit_tx_user_idx" ON "credit_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_owner_uq" ON "products" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_uq" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "products_public_idx" ON "products" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "requests_product_status_idx" ON "testimonial_requests" USING btree ("product_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "requests_fulfilled_uq" ON "testimonial_requests" USING btree ("fulfilled_testimonial_id");--> statement-breakpoint
CREATE UNIQUE INDEX "testimonials_product_author_uq" ON "testimonials" USING btree ("product_id","author_id");--> statement-breakpoint
CREATE INDEX "testimonials_product_status_idx" ON "testimonials" USING btree ("product_id","status");--> statement-breakpoint
CREATE INDEX "testimonials_author_idx" ON "testimonials" USING btree ("author_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_provider_subject_uq" ON "users" USING btree ("provider","provider_subject");