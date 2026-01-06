ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS device_model VARCHAR(255);
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);

ALTER TABLE analytics_sessions ADD COLUMN IF NOT EXISTS device_model VARCHAR(255);
ALTER TABLE analytics_sessions ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
