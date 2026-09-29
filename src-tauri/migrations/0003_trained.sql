-- Trained shortcuts, kept between learning sessions: pressed right while their keys were shown,
-- not yet recalled without them. Records stored before start with none.
ALTER TABLE set_progress
    ADD COLUMN trained TEXT NOT NULL DEFAULT '[]'
    CHECK (json_valid(trained) AND json_type(trained) = 'array');
