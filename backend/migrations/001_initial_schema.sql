-- ============================================================
-- haveismashedV2 — Initial Database Schema
-- PostgreSQL 16 + PostGIS
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS TABLE
-- Stores only the public key. No PII whatsoever.
-- ============================================================
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_key          BYTEA NOT NULL UNIQUE,              -- Ed25519 public key (32 bytes)
    public_key_hash     VARCHAR(64) NOT NULL UNIQUE,        -- SHA-256 hash for fast lookup
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at        TIMESTAMPTZ,
    invite_count        INTEGER NOT NULL DEFAULT 0           -- lifetime platform invites generated (max 10)
                        CHECK (invite_count >= 0 AND invite_count <= 10),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    deletion_requested_at TIMESTAMPTZ                       -- 30-day grace period before hard delete
);

CREATE INDEX idx_users_pubkey_hash ON users(public_key_hash);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_users_deletion ON users(deletion_requested_at) WHERE deletion_requested_at IS NOT NULL;

-- ============================================================
-- CITIES LOOKUP (Reference data, not user data)
-- ============================================================
CREATE TABLE cities (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    country_code    CHAR(2) NOT NULL,                       -- ISO 3166-1 alpha-2
    location        GEOMETRY(Point, 4326) NOT NULL,
    population      INTEGER,

    UNIQUE(name, country_code)
);

CREATE INDEX idx_cities_country ON cities(country_code);
CREATE INDEX idx_cities_location ON cities USING GIST(location);
CREATE INDEX idx_cities_name ON cities(name);

-- ============================================================
-- TAGS
-- Predefined + user-created (hybrid system)
-- ============================================================
CREATE TABLE tags (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    is_predefined   BOOLEAN NOT NULL DEFAULT FALSE
);

-- Seed predefined tags
INSERT INTO tags (name, is_predefined) VALUES
    ('App', TRUE),
    ('Bar/Kulüp', TRUE),
    ('Arkadaş aracılığıyla', TRUE),
    ('Tatil', TRUE),
    ('İş seyahati', TRUE),
    ('Diğer', TRUE);

-- ============================================================
-- LOG ENTRIES (Encrypted)
-- Sensitive fields encrypted client-side with AES-256-GCM.
-- Server sees only ciphertext for tags/rating/notes.
-- ============================================================
CREATE TABLE log_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Geographic data (PostGIS point for spatial queries)
    -- City-level precision only, never exact coordinates
    location        GEOMETRY(Point, 4326) NOT NULL,
    country_code    CHAR(2) NOT NULL,                       -- ISO 3166-1 alpha-2
    city_id         INTEGER NOT NULL REFERENCES cities(id),

    -- Encrypted fields (AES-256-GCM ciphertext + IV + auth tag)
    encrypted_data  BYTEA NOT NULL,                         -- Contains: { tags[], rating, notes }
    encryption_iv   BYTEA NOT NULL,                         -- 12-byte IV (unique per entry)

    -- Metadata (non-sensitive, needed for queries)
    entry_date      DATE NOT NULL,                          -- Unencrypted for time-based queries
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ,
    deleted_at      TIMESTAMPTZ                             -- Soft delete, hard delete after 30 days
);

CREATE INDEX idx_logs_user_id ON log_entries(user_id);
CREATE INDEX idx_logs_user_date ON log_entries(user_id, entry_date);
CREATE INDEX idx_logs_location ON log_entries USING GIST(location);
CREATE INDEX idx_logs_country ON log_entries(user_id, country_code);
CREATE INDEX idx_logs_city ON log_entries(user_id, city_id);
CREATE INDEX idx_logs_active ON log_entries(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_logs_soft_deleted ON log_entries(deleted_at) WHERE deleted_at IS NOT NULL;

-- ============================================================
-- CONNECTIONS (Friend relationships)
-- No blocking in MVP — just pending/accepted/rejected
-- ============================================================
CREATE TABLE connections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    responder_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ,

    UNIQUE(requester_id, responder_id),
    CHECK (requester_id != responder_id)
);

CREATE INDEX idx_connections_responder ON connections(responder_id, status);
CREATE INDEX idx_connections_requester ON connections(requester_id, status);
CREATE INDEX idx_connections_accepted ON connections(status) WHERE status = 'accepted';

-- ============================================================
-- PRIVACY SETTINGS
-- Per-connection sharing granularity.
-- NULL connection_id = default settings for all friends.
-- ============================================================
CREATE TABLE privacy_settings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    connection_id   UUID REFERENCES connections(id) ON DELETE CASCADE,

    share_countries BOOLEAN NOT NULL DEFAULT TRUE,
    share_cities    BOOLEAN NOT NULL DEFAULT FALSE,
    share_dates     BOOLEAN NOT NULL DEFAULT FALSE,
    share_stats     BOOLEAN NOT NULL DEFAULT TRUE,

    UNIQUE(user_id, connection_id)
);

CREATE INDEX idx_privacy_user ON privacy_settings(user_id);
CREATE INDEX idx_privacy_connection ON privacy_settings(connection_id);

-- ============================================================
-- INVITES
-- Two types:
--   'platform' — limited: 3/month, 10 lifetime per user
--   'friend'   — unlimited, for adding existing users as friends
-- ============================================================
CREATE TABLE invites (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inviter_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invite_type     VARCHAR(10) NOT NULL
                    CHECK (invite_type IN ('platform', 'friend')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL,                   -- 24h TTL
    used_at         TIMESTAMPTZ,
    used_by         UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_invites_inviter ON invites(inviter_id);
CREATE INDEX idx_invites_type ON invites(inviter_id, invite_type);
CREATE INDEX idx_invites_active ON invites(expires_at) WHERE used_at IS NULL;
CREATE INDEX idx_invites_monthly ON invites(inviter_id, created_at)
    WHERE invite_type = 'platform';
