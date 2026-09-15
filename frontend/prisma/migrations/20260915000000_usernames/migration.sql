-- Add a stable login ID without breaking existing email-only accounts.
ALTER TABLE "users" ADD COLUMN "username" VARCHAR(64);

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

ALTER TABLE "users"
  ADD CONSTRAINT "users_username_normalized"
  CHECK (
    username IS NULL OR (
      username = lower(btrim(username))
      AND username ~ '^[a-z0-9._-]{3,64}$'
    )
  );
