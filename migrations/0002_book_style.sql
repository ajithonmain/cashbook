-- Per-book icon (a key from the client's icon set) and color (a hue, 0-359; NULL means derive from the name).
ALTER TABLE books ADD COLUMN icon TEXT NOT NULL DEFAULT 'book';
ALTER TABLE books ADD COLUMN color INTEGER;
