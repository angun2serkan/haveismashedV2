ALTER TABLE badges ADD COLUMN gender VARCHAR(10) DEFAULT 'both' CHECK (gender IN ('male', 'female', 'both'));
-- Update existing badges to 'both' (they apply to everyone)
UPDATE badges SET gender = 'both' WHERE gender IS NULL;
