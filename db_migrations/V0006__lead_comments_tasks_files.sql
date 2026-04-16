CREATE TABLE IF NOT EXISTS lead_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL,
    owner_id uuid NOT NULL,
    text text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lead_comments_lead ON lead_comments(lead_id);

CREATE TABLE IF NOT EXISTS lead_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL,
    owner_id uuid NOT NULL,
    done_text text NOT NULL DEFAULT '',
    todo_text text NOT NULL DEFAULT '',
    due_at timestamptz NULL,
    completed boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_lead ON lead_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_due ON lead_tasks(due_at);

CREATE TABLE IF NOT EXISTS lead_files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL,
    owner_id uuid NOT NULL,
    name text NOT NULL DEFAULT '',
    url text NOT NULL DEFAULT '',
    mime text NOT NULL DEFAULT '',
    size_bytes bigint NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lead_files_lead ON lead_files(lead_id);