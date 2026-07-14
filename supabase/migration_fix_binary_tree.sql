-- Simple fix: set left_child_id for each sponsor (first referral)
UPDATE users
SET left_child_id = (
  SELECT id FROM users AS child
  WHERE child.sponsor_id = users.id
  ORDER BY child.created_at ASC
  LIMIT 1
)
WHERE left_child_id IS NULL
  AND id IN (SELECT DISTINCT sponsor_id FROM users WHERE sponsor_id IS NOT NULL);

-- Set right_child_id for each sponsor (second referral)
UPDATE users
SET right_child_id = (
  SELECT id FROM users AS child
  WHERE child.sponsor_id = users.id
  ORDER BY child.created_at ASC
  LIMIT 1 OFFSET 1
)
WHERE right_child_id IS NULL
  AND id IN (
    SELECT sponsor_id FROM users WHERE sponsor_id IS NOT NULL
    GROUP BY sponsor_id HAVING COUNT(*) >= 2
  );
