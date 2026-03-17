CREATE TABLE user_streaks (
    user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak  INTEGER NOT NULL DEFAULT 0,
    longest_streak  INTEGER NOT NULL DEFAULT 0,
    last_log_week   INTEGER,  -- ISO week number of last logged date (e.g., 202612)
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
