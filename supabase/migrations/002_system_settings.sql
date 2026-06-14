CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    office_lat DOUBLE PRECISION NOT NULL,
    office_lng DOUBLE PRECISION NOT NULL,
    radius_meters INTEGER NOT NULL DEFAULT 50,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
