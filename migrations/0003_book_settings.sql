-- Per-book entry-field configuration (categories, payment modes, show/required toggles, custom fields),
-- stored as an opaque JSON blob the server never parses. NULL means "use the client's legacy defaults".
ALTER TABLE books ADD COLUMN settings TEXT;

-- Per-transaction custom-field values, keyed by BookSettings.customFields[].id. Same opaque-JSON treatment.
ALTER TABLE transactions ADD COLUMN custom_fields TEXT;
