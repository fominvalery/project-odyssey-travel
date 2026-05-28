CREATE TABLE IF NOT EXISTS t_p32045231_project_odyssey_trav.content_articles (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type varchar(20) NOT NULL DEFAULT 'blog',
    title text NOT NULL,
    preview text NOT NULL DEFAULT '',
    body text NOT NULL DEFAULT '',
    category varchar(50) NOT NULL DEFAULT 'news',
    status varchar(20) NOT NULL DEFAULT 'draft',
    tags text NOT NULL DEFAULT '',
    photos text[] NOT NULL DEFAULT '{}',
    videos text[] NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);