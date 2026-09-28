-- The settings the user changed, one row each. A missing key uses its default from `settings.rs`.
CREATE TABLE settings (
    -- The setting's name, as the frontend spells it (`showDockIcon`).
    key TEXT PRIMARY KEY,
    -- Its value as JSON.
    value TEXT NOT NULL
) STRICT;
