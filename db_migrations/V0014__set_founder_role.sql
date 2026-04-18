-- Создатели организаций получают роль "Учредитель" (founder)
UPDATE t_p32045231_project_odyssey_trav.org_memberships m
SET role_code = 'founder'
FROM t_p32045231_project_odyssey_trav.organizations o
WHERE m.organization_id = o.id
  AND m.user_id = o.admin_id
  AND m.role_code = 'director';
