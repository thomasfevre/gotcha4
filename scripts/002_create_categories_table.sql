-- Create categories table for organizing annoyances
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name) VALUES
    -- Tech & Digital Life
    ('Software & Apps'),
    ('Hardware & Gadgets'),
    ('Social Media'),
    ('Productivity Tools'),
    ('Gaming'),
    -- Products & Services
    ('E-commerce & Shopping'),
    ('Customer Service'),
    ('Delivery & Logistics'),
    ('Finance & Banking'),
    ('Travel & Hospitality'),
    -- Daily Life
    ('Home & Housing'),
    ('Transportation & Commuting'),
    ('Health & Wellness'),
    ('Food & Dining'),
    ('Bureaucracy'),
    -- Work & Professional
    ('Office Life'),
    ('Job Hunting'),
    ('Freelancing & Gigs'),
    ('Meetings'),
    -- Society & Community
    ('Environment & Sustainability'),
    ('Local Community'),
    ('Education'),
    ('Accessibility')
ON CONFLICT (name) DO NOTHING;


-- Create index for faster category name lookups
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
