-- Add furigana (name_kana) column to customers
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS name_kana text;
