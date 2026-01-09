-- Migration: Add named unique constraint to listening_heatmap
-- Date: 2026-01-08
-- Purpose: Fix "constraint uq_date_hour does not exist" error in analytics aggregation

-- Step 1: Drop the existing unnamed unique constraint
-- First, find the constraint name (it's auto-generated)
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the existing unnamed constraint
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'listening_heatmap'::regclass
      AND contype = 'u'
      AND conname != 'uq_date_hour';
    
    -- Drop it if found
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE listening_heatmap DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE 'Dropped existing constraint: %', constraint_name;
    END IF;
END $$;

-- Step 2: Add the named constraint (if it doesn't already exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'listening_heatmap'::regclass 
        AND conname = 'uq_date_hour'
    ) THEN
        ALTER TABLE listening_heatmap 
        ADD CONSTRAINT uq_date_hour UNIQUE (date, hour);
        RAISE NOTICE 'Created named constraint: uq_date_hour';
    ELSE
        RAISE NOTICE 'Constraint uq_date_hour already exists';
    END IF;
END $$;

-- Verify the constraint exists
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'listening_heatmap'::regclass
  AND contype = 'u';
