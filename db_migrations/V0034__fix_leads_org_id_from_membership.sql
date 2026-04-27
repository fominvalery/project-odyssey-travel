UPDATE t_p32045231_project_odyssey_trav.leads l
SET org_id = om.organization_id
FROM t_p32045231_project_odyssey_trav.org_memberships om
WHERE l.owner_id = om.user_id
  AND l.org_id IS NULL
  AND om.status = 'active';