-- PTC Ads PostgreSQL schema (fresh database)
-- Run: npm run db:init
-- This script is idempotent for tables/indexes. Back up existing data before schema changes.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(254) NOT NULL UNIQUE,
  name VARCHAR(80) NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(16) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER','ADMIN')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  type VARCHAR(32) NOT NULL CHECK (type IN ('DEPOSIT','CAMPAIGN_FUNDING','AD_REWARD','WITHDRAWAL','REFUND','ADMIN_ADJUSTMENT')),
  description TEXT NOT NULL,
  idempotency_key VARCHAR(200) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  description VARCHAR(500) NOT NULL,
  target_url VARCHAR(2048) NOT NULL,
  budget_remaining NUMERIC(12,2) NOT NULL CHECK (budget_remaining >= 0),
  click_reward NUMERIC(8,2) NOT NULL CHECK (click_reward > 0),
  status VARCHAR(24) NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (status IN ('PENDING_REVIEW','ACTIVE','PAUSED','COMPLETED','REJECTED')),
  reviewed_at TIMESTAMPTZ,
  review_note VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ad_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  status VARCHAR(16) NOT NULL DEFAULT 'STARTED' CHECK (status IN ('STARTED','COMPLETED','EXPIRED')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 5),
  method VARCHAR(50) NOT NULL,
  reference VARCHAR(120) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 5),
  method VARCHAR(50) NOT NULL,
  destination VARCHAR(200) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(64) NOT NULL,
  entity VARCHAR(64) NOT NULL,
  entity_id UUID NOT NULL,
  metadata TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS wallet_transactions_user_created_idx ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS campaigns_status_created_idx ON campaigns(status, created_at DESC);
CREATE INDEX IF NOT EXISTS campaigns_owner_created_idx ON campaigns(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ad_views_user_started_idx ON ad_views(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS ad_views_campaign_status_idx ON ad_views(campaign_id, status);
CREATE INDEX IF NOT EXISTS deposits_status_created_idx ON deposits(status, created_at);
CREATE INDEX IF NOT EXISTS deposits_user_created_idx ON deposits(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS withdrawals_status_created_idx ON withdrawals(status, created_at);
CREATE INDEX IF NOT EXISTS withdrawals_user_created_idx ON withdrawals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_entity_created_idx ON audit_logs(entity, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_actor_created_idx ON audit_logs(actor_id, created_at DESC);
COMMIT;
