-- Normalize personality risk/time values from 1-10 scale to 1-5 scale
-- Any values > 5 are halved and rounded
UPDATE profiles
SET personality = jsonb_set(
  jsonb_set(
    personality,
    '{risk}',
    to_jsonb(ROUND((personality->>'risk')::numeric / 2))
  ),
  '{time}',
  to_jsonb(ROUND((personality->>'time')::numeric / 2))
)
WHERE personality IS NOT NULL
  AND (
    (personality->>'risk')::numeric > 5
    OR (personality->>'time')::numeric > 5
  );
