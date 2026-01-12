CREATE TABLE IF NOT EXISTS plugins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    capability VARCHAR(50) NOT NULL,
    url VARCHAR(255) NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT false,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plugins_capability ON plugins (capability);
