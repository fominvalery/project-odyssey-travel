UPDATE leads l
SET department_id = om.department_id
FROM org_memberships om
WHERE om.user_id = l.owner_id
  AND om.status = 'active'
  AND om.department_id IS NOT NULL
  AND l.department_id IS NULL
  AND (l.org_id IS NULL OR l.org_id = om.organization_id);