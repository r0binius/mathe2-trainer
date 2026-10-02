-- How often each shortcut was used, by keys or from a menu, per local day: what Mouseless counts
-- while "Learn from how I work" is on. Nothing else about the use is kept, and turning the switch
-- off deletes every row.
CREATE TABLE usage (
    shortcut_id TEXT NOT NULL,
    layout TEXT NOT NULL,
    -- The local day number, as the frontend's localDay counts it.
    day INTEGER NOT NULL,
    by_keys INTEGER NOT NULL DEFAULT 0 CHECK (by_keys >= 0),
    by_menu INTEGER NOT NULL DEFAULT 0 CHECK (by_menu >= 0),
    PRIMARY KEY (shortcut_id, layout, day)
) STRICT;
