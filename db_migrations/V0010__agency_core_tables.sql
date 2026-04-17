-- Agency / Organization multi-tenant tables

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  inn TEXT,
  logo_url TEXT,
  admin_id UUID NOT NULL REFERENCES users(id),
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_org_admin ON organizations(admin_id);

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  head_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dept_org ON departments(organization_id);

CREATE TABLE IF NOT EXISTS org_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  department_id UUID REFERENCES departments(id),
  role_code TEXT NOT NULL DEFAULT 'broker',
  status TEXT NOT NULL DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, organization_id)
);
CREATE INDEX IF NOT EXISTS idx_mem_org ON org_memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_mem_user ON org_memberships(user_id);

CREATE TABLE IF NOT EXISTS org_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  invited_by UUID NOT NULL REFERENCES users(id),
  email TEXT NOT NULL,
  phone TEXT,
  full_name TEXT NOT NULL,
  role_code TEXT NOT NULL DEFAULT 'broker',
  department_id UUID REFERENCES departments(id),
  token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inv_match ON org_invites(email, status);
CREATE INDEX IF NOT EXISTS idx_inv_token ON org_invites(token);
CREATE INDEX IF NOT EXISTS idx_inv_org ON org_invites(organization_id);
