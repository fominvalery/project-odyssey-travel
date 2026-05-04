UPDATE objects o
SET org_id = COALESCE(o.org_id, om.organization_id),
    department_id = COALESCE(o.department_id, om.department_id)
FROM org_memberships om
WHERE om.user_id = o.user_id
  AND om.status = 'active'
  AND (o.org_id IS NULL OR (o.department_id IS NULL AND om.department_id IS NOT NULL));