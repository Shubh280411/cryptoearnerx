-- Fix existing binary tree: populate left_child_id/right_child_id for all sponsors
-- based on sponsor_id relationships

UPDATE users u
SET left_child_id = sub.child_id
FROM (
  SELECT DISTINCT ON (sponsor_id)
    sponsor_id,
    id as child_id
  FROM users
  WHERE sponsor_id IS NOT NULL
  ORDER BY sponsor_id, created_at ASC
) sub
WHERE u.id = sub.sponsor_id
  AND u.left_child_id IS NULL;

UPDATE users u
SET right_child_id = sub.child_id
FROM (
  SELECT
    sponsor_id,
    id as child_id,
    ROW_NUMBER() OVER (PARTITION BY sponsor_id ORDER BY created_at ASC) as rn
  FROM users
  WHERE sponsor_id IS NOT NULL
) sub
WHERE u.id = sub.sponsor_id
  AND sub.rn = 2
  AND u.right_child_id IS NULL;
