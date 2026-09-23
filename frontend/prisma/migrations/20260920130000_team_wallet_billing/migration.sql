-- Migration: 20260920130000_team_wallet_billing
-- Adds TeamWallet, WalletTopup, WalletTransaction, and BillingRateCard tables for per-SKU/variant/marketplace billing.

-- 1. Create TransactionType ENUM
CREATE TYPE "TransactionType" AS ENUM ('TOPUP_CREDIT', 'SKU_LISTING_DEDUCTION', 'REFUND_CREDIT');

-- 2. Create team_wallets table
CREATE TABLE IF NOT EXISTS "team_wallets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "team_id" UUID NOT NULL,
    "balance" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_wallets_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "team_wallets_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "team_wallets_team_id_key" ON "team_wallets"("team_id");

-- 3. Create wallet_topups table
CREATE TABLE IF NOT EXISTS "wallet_topups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wallet_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "payment_method" VARCHAR(50),
    "payment_ref" VARCHAR(255),
    "status" "JobStatus" NOT NULL DEFAULT 'COMPLETED',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_topups_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "wallet_topups_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "team_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "wallet_topups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "wallet_topups_wallet_id_created_at_idx" ON "wallet_topups"("wallet_id", "created_at");
CREATE INDEX IF NOT EXISTS "wallet_topups_user_id_idx" ON "wallet_topups"("user_id");

-- 4. Create billing_rate_cards table
CREATE TABLE IF NOT EXISTS "billing_rate_cards" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "platform" "Marketplace" NOT NULL,
    "marketplace_region" VARCHAR(40) NOT NULL DEFAULT 'IN',
    "base_sku_fee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "per_variant_fee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_rate_cards_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "billing_rate_cards_platform_marketplace_region_key" 
ON "billing_rate_cards"("platform", "marketplace_region");

-- 5. Create wallet_transactions table
CREATE TABLE IF NOT EXISTS "wallet_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wallet_id" UUID NOT NULL,
    "variant_id" UUID,
    "listing_id" UUID,
    "platform" "Marketplace",
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "balance_after" DECIMAL(14,2) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "team_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "wallet_transactions_wallet_id_created_at_idx" ON "wallet_transactions"("wallet_id", "created_at");
CREATE INDEX IF NOT EXISTS "wallet_transactions_variant_id_idx" ON "wallet_transactions"("variant_id");
CREATE INDEX IF NOT EXISTS "wallet_transactions_listing_id_idx" ON "wallet_transactions"("listing_id");
