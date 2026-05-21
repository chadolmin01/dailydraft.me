-- Add structured idea columns to validated_ideas table
ALTER TABLE validated_ideas
ADD COLUMN IF NOT EXISTS problem TEXT,
ADD COLUMN IF NOT EXISTS solution TEXT,
ADD COLUMN IF NOT EXISTS target TEXT;

-- Add index for searching
CREATE INDEX IF NOT EXISTS idx_validated_ideas_problem ON validated_ideas(problem) WHERE problem IS NOT NULL;
