-- How many keys each tested shortcut had, which its time is compared by when grading. Reviews
-- logged before have none, and grading leaves them out.
ALTER TABLE reviews ADD COLUMN key_count INTEGER CHECK (key_count > 0);
