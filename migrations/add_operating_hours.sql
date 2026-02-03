-- Migration: Add operating_hours column to workshops table
-- This allows storing per-day operating hours schedules

-- Add operating_hours column to workshops table
ALTER TABLE workshops 
ADD COLUMN IF NOT EXISTS operating_hours JSONB;

-- Add comment for documentation
COMMENT ON COLUMN workshops.operating_hours IS 'Per-day operating hours schedule in JSONB format. Structure: {"monday": {"isOpen": true, "openTime": "08:00", "closeTime": "17:00"}, ...}';

-- Example data structure:
-- {
--   "monday": { "isOpen": true, "openTime": "08:00", "closeTime": "17:00" },
--   "tuesday": { "isOpen": true, "openTime": "08:00", "closeTime": "12:00" },
--   "wednesday": { "isOpen": true, "openTime": "08:00", "closeTime": "17:00" },
--   "thursday": { "isOpen": true, "openTime": "08:00", "closeTime": "17:00" },
--   "friday": { "isOpen": true, "openTime": "08:00", "closeTime": "17:00" },
--   "saturday": { "isOpen": true, "openTime": "09:00", "closeTime": "14:00" },
--   "sunday": { "isOpen": false, "openTime": "08:00", "closeTime": "17:00" }
-- }
