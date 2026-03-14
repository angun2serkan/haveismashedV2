-- ============================================================
-- haveismashedV2 — Seed Tags by Category (with explicit IDs)
-- ============================================================

-- ============================================================
-- MEETING TAGS — How you met the person (IDs 1–10)
-- ============================================================
INSERT INTO tags (id, name, category, is_predefined) VALUES
    (1,  'Dating App',     'meeting', TRUE),
    (2,  'Bar/Club',       'meeting', TRUE),
    (3,  'Through Friends','meeting', TRUE),
    (4,  'Work/School',    'meeting', TRUE),
    (5,  'Social Media',   'meeting', TRUE),
    (6,  'Public Place',   'meeting', TRUE),
    (7,  'Event/Party',    'meeting', TRUE),
    (8,  'Gym/Sports',     'meeting', TRUE),
    (9,  'Online Other',   'meeting', TRUE),
    (10, 'Blind Date',     'meeting', TRUE);

-- ============================================================
-- VENUE TAGS — Where the date took place (IDs 11–25)
-- ============================================================
INSERT INTO tags (id, name, category, is_predefined) VALUES
    (11, 'Restaurant',     'venue', TRUE),
    (12, 'Cafe',           'venue', TRUE),
    (13, 'Bar',            'venue', TRUE),
    (14, 'Club/Nightclub', 'venue', TRUE),
    (15, 'Park',           'venue', TRUE),
    (16, 'Beach',          'venue', TRUE),
    (17, 'Cinema',         'venue', TRUE),
    (18, 'Museum/Gallery', 'venue', TRUE),
    (19, 'Shopping Mall',  'venue', TRUE),
    (20, 'Home',           'venue', TRUE),
    (21, 'Hotel',          'venue', TRUE),
    (22, 'Rooftop',        'venue', TRUE),
    (23, 'Concert/Event',  'venue', TRUE),
    (24, 'Spa/Wellness',   'venue', TRUE),
    (25, 'Amusement Park', 'venue', TRUE);

-- ============================================================
-- ACTIVITY TAGS — What you did on the date (IDs 26–45)
-- ============================================================
INSERT INTO tags (id, name, category, is_predefined) VALUES
    (26, 'Dinner',           'activity', TRUE),
    (27, 'Drinks',           'activity', TRUE),
    (28, 'Coffee',           'activity', TRUE),
    (29, 'Movie',            'activity', TRUE),
    (30, 'Walk/Stroll',      'activity', TRUE),
    (31, 'Dancing',          'activity', TRUE),
    (32, 'Sex',              'activity', TRUE),
    (33, 'Cooking Together', 'activity', TRUE),
    (34, 'Sports/Fitness',   'activity', TRUE),
    (35, 'Shopping',         'activity', TRUE),
    (36, 'Travel',           'activity', TRUE),
    (37, 'Sightseeing',      'activity', TRUE),
    (38, 'Concert/Show',     'activity', TRUE),
    (39, 'Gaming',           'activity', TRUE),
    (40, 'Picnic',           'activity', TRUE),
    (41, 'Swimming',         'activity', TRUE),
    (42, 'Hiking/Trekking',  'activity', TRUE),
    (43, 'Karaoke',          'activity', TRUE),
    (44, 'Board Games',      'activity', TRUE),
    (45, 'Hookah/Shisha',    'activity', TRUE);

-- ============================================================
-- PHYSICAL TAGS (FEMALE) — Physical attributes for female dates (IDs 46–61)
-- ============================================================
INSERT INTO tags (id, name, category, is_predefined) VALUES
    -- Hair
    (46, 'Blonde',         'physical_female', TRUE),
    (47, 'Brunette',       'physical_female', TRUE),
    (48, 'Redhead',        'physical_female', TRUE),
    (49, 'Black Hair',     'physical_female', TRUE),
    (50, 'Colored Hair',   'physical_female', TRUE),
    -- Height
    (51, 'Short',          'physical_female', TRUE),
    (52, 'Average Height', 'physical_female', TRUE),
    (53, 'Tall',           'physical_female', TRUE),
    -- Body
    (54, 'Slim',           'physical_female', TRUE),
    (55, 'Fit/Athletic',   'physical_female', TRUE),
    (56, 'Curvy',          'physical_female', TRUE),
    (57, 'Plus Size',      'physical_female', TRUE),
    -- Style
    (58, 'Tattoos',        'physical_female', TRUE),
    (59, 'Piercings',      'physical_female', TRUE),
    (60, 'Glasses',        'physical_female', TRUE),
    (61, 'Hijab',          'physical_female', TRUE);

-- ============================================================
-- PHYSICAL TAGS (MALE) — Physical attributes for male dates (IDs 62–81)
-- ============================================================
INSERT INTO tags (id, name, category, is_predefined) VALUES
    -- Hair
    (62, 'Blonde',        'physical_male', TRUE),
    (63, 'Brunette',      'physical_male', TRUE),
    (64, 'Redhead',       'physical_male', TRUE),
    (65, 'Black Hair',    'physical_male', TRUE),
    (66, 'Bald',          'physical_male', TRUE),
    -- Height
    (67, 'Short',          'physical_male', TRUE),
    (68, 'Average Height', 'physical_male', TRUE),
    (69, 'Tall',           'physical_male', TRUE),
    -- Body
    (70, 'Slim',           'physical_male', TRUE),
    (71, 'Athletic',       'physical_male', TRUE),
    (72, 'Muscular',       'physical_male', TRUE),
    (73, 'Dad Bod',        'physical_male', TRUE),
    (74, 'Plus Size',      'physical_male', TRUE),
    -- Facial Hair
    (75, 'Beard',          'physical_male', TRUE),
    (76, 'Mustache',       'physical_male', TRUE),
    (77, 'Clean Shaven',   'physical_male', TRUE),
    (78, 'Stubble',        'physical_male', TRUE),
    -- Style
    (79, 'Tattoos',        'physical_male', TRUE),
    (80, 'Piercings',      'physical_male', TRUE),
    (81, 'Glasses',        'physical_male', TRUE);

-- Sync the sequence so future inserts get IDs > 81
SELECT setval('tags_id_seq', 81);
