-- Learning progress, one record per set and keyboard layout.
CREATE TABLE set_progress (
    app_id TEXT NOT NULL,
    set_id TEXT NOT NULL,
    -- The macOS input source ID (`com.apple.keylayout.German`).
    layout TEXT NOT NULL,
    -- The learned shortcut IDs, as a JSON array.
    learned TEXT NOT NULL CHECK (json_valid(learned) AND json_type(learned) = 'array'),
    -- When the set was last completed, in epoch milliseconds, like every time below.
    completed_at INTEGER,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (app_id, set_id, layout)
) STRICT;

-- What the memory model knows about each recalled shortcut, per keyboard layout.
CREATE TABLE cards (
    shortcut_id TEXT NOT NULL,
    layout TEXT NOT NULL,
    stability REAL NOT NULL,
    difficulty REAL NOT NULL,
    last_review_at INTEGER NOT NULL,
    due_at INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    lapses INTEGER NOT NULL,
    PRIMARY KEY (shortcut_id, layout)
) STRICT;

-- Every test that counts for reviews, kept as history so FSRS and the grading limits can be
-- fitted to the user's own data. Only appended to, and cleared only by a reset.
CREATE TABLE reviews (
    id INTEGER PRIMARY KEY,
    shortcut_id TEXT NOT NULL,
    layout TEXT NOT NULL,
    reviewed_at INTEGER NOT NULL,
    -- Minutes east of UTC at that moment, so days can be counted in local time.
    utc_offset_minutes INTEGER NOT NULL,
    grade TEXT NOT NULL CHECK (grade IN ('again', 'hard', 'good', 'easy')),
    -- Whether wrong keys were pressed first.
    failed INTEGER NOT NULL CHECK (failed IN (0, 1)),
    -- Time from showing the shortcut to the correct answer.
    duration_ms INTEGER NOT NULL
) STRICT;
