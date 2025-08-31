-- Add bio field to profiles table
ALTER TABLE profiles ADD COLUMN bio TEXT;

-- Add constraint to limit bio length
ALTER TABLE profiles ADD CONSTRAINT bio_length_check CHECK (LENGTH(bio) <= 500);
