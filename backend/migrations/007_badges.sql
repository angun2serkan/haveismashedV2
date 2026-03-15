-- Badges definition table
CREATE TABLE badges (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL,
    icon        VARCHAR(10) NOT NULL,          -- emoji
    category    VARCHAR(20) NOT NULL CHECK (category IN ('dates', 'explore', 'social', 'quality')),
    threshold   INTEGER NOT NULL                -- the number needed to earn it
);

-- User-earned badges
CREATE TABLE user_badges (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id    INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);

-- Seed badges
INSERT INTO badges (id, name, description, icon, category, threshold) VALUES
    (1,  'İlk Adım',         'İlk date''ini oluştur',                    '🌱', 'dates',   1),
    (2,  'Çaylak',            '5 date''e çık',                            '🔥', 'dates',   5),
    (3,  'Kaşif',             '10 date''e çık',                           '🧭', 'dates',   10),
    (4,  'Tecrübeli',         '25 date''e çık',                           '⭐', 'dates',   25),
    (5,  'Profesyonel',       '50 date''e çık',                           '💎', 'dates',   50),
    (6,  'Efsane',            '100 date''e çık',                          '👑', 'dates',   100),
    (7,  'Gezgin',            '3 farklı ülkede date''e çık',              '🌍', 'explore', 3),
    (8,  'Dünya Vatandaşı',   '10 farklı ülkede date''e çık',            '✈️', 'explore', 10),
    (9,  'Şehir Avcısı',     '5 farklı şehirde date''e çık',            '🏙️', 'explore', 5),
    (10, 'Metropol',          '15 farklı şehirde date''e çık',           '🗺️', 'explore', 15),
    (11, 'Yüksek Standart',  'Ortalama puanın 8 veya üstü olsun (min 5 date)', '🎯', 'quality', 8),
    (12, 'Sosyal Kelebek',   '5 arkadaş edin',                           '🦋', 'social',  5);

SELECT setval('badges_id_seq', 12);
