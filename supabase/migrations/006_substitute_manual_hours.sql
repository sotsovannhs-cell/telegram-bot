CREATE TABLE IF NOT EXISTS substitute_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    substitute_employee_id UUID REFERENCES employees(id),
    absent_employee_id UUID REFERENCES employees(id),
    date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS manual_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    hours DOUBLE PRECISION NOT NULL,
    date DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
