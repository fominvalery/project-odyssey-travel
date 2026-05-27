CREATE TABLE IF NOT EXISTS t_p32045231_project_odyssey_trav.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'email',
    audience TEXT NOT NULL DEFAULT 'all',
    subject TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    scheduled_at TIMESTAMP WITH TIME ZONE NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    recipients INTEGER NOT NULL DEFAULT 0,
    opens INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    sent_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);