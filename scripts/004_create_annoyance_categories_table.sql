-- Create join table for annoyances and categories (many-to-many relationship)
CREATE TABLE IF NOT EXISTS annoyance_categories (
    annoyance_id BIGINT NOT NULL REFERENCES annoyances(id) ON DELETE CASCADE,
    category_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (annoyance_id, category_id)
);

-- Create indexes for faster joins
CREATE INDEX IF NOT EXISTS idx_annoyance_categories_annoyance_id ON annoyance_categories(annoyance_id);
CREATE INDEX IF NOT EXISTS idx_annoyance_categories_category_id ON annoyance_categories(category_id);
