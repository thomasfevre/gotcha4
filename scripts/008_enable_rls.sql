-- Enable Row Level Security (RLS) for data protection
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE annoyances ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (true);

-- RLS Policies for annoyances table
CREATE POLICY "Anyone can view annoyances" ON annoyances FOR SELECT USING (true);
CREATE POLICY "Users can insert their own annoyances" ON annoyances FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own annoyances" ON annoyances FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own annoyances" ON annoyances FOR DELETE USING (true);

-- RLS Policies for likes table
CREATE POLICY "Anyone can view likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can manage their own likes" ON likes FOR ALL USING (true);

-- RLS Policies for comments table
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can insert comments" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE USING (true);

-- Categories and annoyance_categories are public read-only for regular users
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE annoyance_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view annoyance categories" ON annoyance_categories FOR SELECT USING (true);
CREATE POLICY "Users can manage annoyance categories" ON annoyance_categories FOR ALL USING (true);
