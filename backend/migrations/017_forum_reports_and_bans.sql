-- Forum reports
CREATE TABLE forum_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type     VARCHAR(10) NOT NULL CHECK (target_type IN ('topic', 'comment')),
    target_id       UUID NOT NULL,
    reason          VARCHAR(30) NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'misinformation', 'other')),
    description     TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
    reviewed_by     VARCHAR(100),  -- admin identifier
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Prevent duplicate reports from same user on same target
    UNIQUE(reporter_id, target_type, target_id)
);

CREATE INDEX idx_reports_status ON forum_reports(status) WHERE status = 'pending';
CREATE INDEX idx_reports_target ON forum_reports(target_type, target_id);

-- Forum ban support on users table
ALTER TABLE users ADD COLUMN forum_banned_until TIMESTAMPTZ;

-- Ban history
CREATE TABLE forum_ban_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    banned_by       VARCHAR(100) NOT NULL,  -- admin identifier
    duration_hours  INTEGER NOT NULL,       -- 0 = permanent
    reason          TEXT,
    banned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ            -- NULL = permanent
);

CREATE INDEX idx_ban_history_user ON forum_ban_history(user_id);
