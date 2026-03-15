-- Add new rating columns to dates table
ALTER TABLE dates ADD COLUMN face_rating INTEGER CHECK (face_rating >= 1 AND face_rating <= 10);
ALTER TABLE dates ADD COLUMN body_rating INTEGER CHECK (body_rating >= 1 AND body_rating <= 10);
ALTER TABLE dates ADD COLUMN chat_rating INTEGER CHECK (chat_rating >= 1 AND chat_rating <= 10);

-- Update tags category constraint to include new categories
ALTER TABLE tags DROP CONSTRAINT tags_category_check;
ALTER TABLE tags ADD CONSTRAINT tags_category_check
    CHECK (category IN ('meeting', 'venue', 'activity', 'physical_male', 'physical_female', 'face', 'personality'));

-- Add created_by column for custom (user-created) tags
ALTER TABLE tags ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Seed face-related tags (IDs 82-91)
INSERT INTO tags (id, name, category, is_predefined) VALUES
    (82, 'Beautiful Eyes', 'face', TRUE),
    (83, 'Nice Smile', 'face', TRUE),
    (84, 'Dimples', 'face', TRUE),
    (85, 'Sharp Features', 'face', TRUE),
    (86, 'Soft Features', 'face', TRUE),
    (87, 'Freckles', 'face', TRUE),
    (88, 'Strong Jawline', 'face', TRUE),
    (89, 'Baby Face', 'face', TRUE),
    (90, 'Full Lips', 'face', TRUE),
    (91, 'High Cheekbones', 'face', TRUE);

-- Seed personality/chat-energy tags (IDs 92-103)
INSERT INTO tags (id, name, category, is_predefined) VALUES
    (92,  'Funny', 'personality', TRUE),
    (93,  'Smart/Intellectual', 'personality', TRUE),
    (94,  'Good Listener', 'personality', TRUE),
    (95,  'Energetic', 'personality', TRUE),
    (96,  'Calm/Chill', 'personality', TRUE),
    (97,  'Mysterious', 'personality', TRUE),
    (98,  'Confident', 'personality', TRUE),
    (99,  'Shy', 'personality', TRUE),
    (100, 'Romantic', 'personality', TRUE),
    (101, 'Sarcastic', 'personality', TRUE),
    (102, 'Awkward', 'personality', TRUE),
    (103, 'Deep Conversations', 'personality', TRUE);

-- Sync the sequence
SELECT setval('tags_id_seq', 103);
