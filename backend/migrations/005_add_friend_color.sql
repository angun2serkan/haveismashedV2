-- Add color column to connections (hex color like #FF5733)
ALTER TABLE connections ADD COLUMN color VARCHAR(7) DEFAULT '#FF5733';
