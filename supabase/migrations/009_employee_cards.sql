CREATE TABLE IF NOT EXISTS employee_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    nfc_serial VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE employees ADD COLUMN IF NOT EXISTS nfc_serial VARCHAR(255);
