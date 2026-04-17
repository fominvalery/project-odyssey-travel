-- Привязка объектов и лидов к агентству и отделу
ALTER TABLE objects
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);

CREATE INDEX IF NOT EXISTS idx_objects_org ON objects(org_id);
CREATE INDEX IF NOT EXISTS idx_objects_dept ON objects(department_id);
CREATE INDEX IF NOT EXISTS idx_leads_org ON leads(org_id);
CREATE INDEX IF NOT EXISTS idx_leads_dept ON leads(department_id);
