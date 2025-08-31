-- Add external_links field to annoyances table
ALTER TABLE annoyances ADD COLUMN external_links JSONB;

-- Create an index for external_links to improve query performance
CREATE INDEX IF NOT EXISTS idx_annoyances_external_links ON annoyances USING gin(external_links);
