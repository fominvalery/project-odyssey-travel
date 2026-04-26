CREATE TABLE IF NOT EXISTS joint_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiator_id UUID NOT NULL,
    partner_id UUID NOT NULL,
    deal_type TEXT NOT NULL DEFAULT 'Совместная работа',
    transaction_type TEXT NOT NULL DEFAULT 'Продажа',
    object_description TEXT NOT NULL DEFAULT '',
    initiator_role TEXT NOT NULL DEFAULT 'Со стороны объекта',
    commission_initiator INT NOT NULL DEFAULT 50,
    commission_partner INT NOT NULL DEFAULT 50,
    commission_base TEXT NOT NULL DEFAULT 'от суммы комиссии сделки',
    comment TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Создана',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS joint_deal_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES joint_deals(id),
    proposed_by UUID NOT NULL,
    proposal_type TEXT NOT NULL DEFAULT 'create',
    new_status TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    response TEXT
);
