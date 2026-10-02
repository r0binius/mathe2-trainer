# Science-backed training

The spec for [#18](https://codeberg.org/gobin/mouseless/issues/18). It closes the gaps that `shortcut-learning-research.md` (§5) found between Mouseless and the research: a low learning criterion, grading limits that are guesses, and nothing that connects practice to real use.

## 1. Decisions

| Decision           | Choice                                                                                              | Grounds                                                                                                                            |
| ------------------ | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Learning criterion | **2 correct recalls** without the keys, with other shortcuts in between; a mistake resets the count | Vaughn & Rawson (2011) recommend 3; 2 doubles the tests for new shortcuts instead of tripling them, and FSRS reviews follow anyway |
| Grading limits     | **Relative to your own median** time for shortcuts with the same number of keys                     | Speed shows how automatic a skill is (Fitts & Posner; Segalowitz); people and chords differ                                        |
| Coach              | **Collects** the shortcuts you choose from menus, and **shows them briefly**                        | Reminders at the moment of use raise shortcut use (Grossman et al., 2007); frequent commands make the switch sooner                |
| Coach scope        | **Only shortcuts in Mouseless's data**                                                              | Practice uses the existing cards; unknown apps and commands need content made from menus, which is a step of its own               |
| Usage counts       | **Key presses and menu choices** of each shortcut, per day                                          | The share done by keyboard measures transfer, which recall alone can't show                                                        |
| Privacy            | **One switch, off by default:** "Learn from how I work"                                             | Watching menus and key presses needs consent; only counts are stored, on this Mac, and turning it off deletes them                 |
| Banner             | **A setting of its own, on** once the coach is on                                                   | Quiet enough to keep; visual hints were weak in Grossman et al., so it can be turned off without losing the rest                   |

## 2. Learning criterion

Learning gets a fourth stage between trained and learned:

```
unseen ──shown, pressed──► trained ──recalled──► recalled once ──recalled──► learned
                              ▲                         │
                              └────────── mistake ──────┘
```

- **Recalled once** is picked with the weight of trained (50), so other shortcuts come in between and the second recall is spaced.
- The stage lives only in the session: the stored set progress keeps `learned` and `trained` as now, and a shortcut recalled once is stored as trained. An interrupted session costs at most one recall.
- Shortcuts learned before this change stay learned.
- The first test of each shortcut in a session is still the one graded for FSRS, as now.
- The criterion is a named constant of the learn flow (`recallsToLearn = 2`), so it can be tested and changed in one place.

## 3. Relative grading

Today `gradeRecall` gives `easy` under 2 s and `hard` over 6 s. Instead:

- **Your typical time** for a shortcut is the median of your recent correct first tries (the last 200, from the review log) of shortcuts with the same number of keys on this layout.
- **Easy** below 0.6 × that median, **hard** above 2 × that median, good in between, `again` after a mistake as now.
- **Until there are 20 such tries**, the fixed 2 s and 6 s apply.

The factors are a proposal. At a typical time of 3 s they give easy under 1.8 s and hard over 6 s, close to today's limits. There's no real data to check them against yet (the installed app has no reviews; the development database has 14 test runs), so they're revisited once a few weeks of reviews exist.

What changes underneath:

- The review log reaches the frontend with each review's duration, whether it failed, and its number of keys.
- **The number of keys is stored with each review** (`reviews.key_count`, migration 0004): the session knows the keys it tested, so the count is what was actually pressed then. It stays right when a shortcut is renamed or removed, and grading needs no lookup of the apps. Reviews logged before have no count and are left out. (Decided in 18.2 instead of resolving each card's practice item on the current layout.)
- `gradeRecall` takes the typical time as an argument, so it stays a pure function; the session gets it from the store with each test.

**A caveat:** a test's time includes reading the title, so long titles are slower to answer. Grouping by number of keys doesn't correct for that; if the grades look skewed, title length is the next factor to look at.

## 4. Watching how you work

All of this runs only while **Settings → General → Learn from how I work** is on. Turning it off stops watching and deletes the counts.

- **Permissions:** watching needs Accessibility (menus) and Input Monitoring (the event tap). The switch turns on regardless, and macOS asks for what's missing; until both are granted, the Settings row says which one is missing, with a button that opens System Settings there. Watching starts once both are granted.
- **Its own event tap:** the coach doesn't share the ⌘-hold tap, which lives as long as the app. It makes a tap of its own when the switch turns on, and removes it when it turns off, so off really means nothing is watched.

### 4.1 Menu choices (the coach)

- Mouseless observes the frontmost app's menus through Accessibility (granted already for the lookup) and follows the **highlighted item**: on `AXSelectedChildrenChanged` from a menu, it reads the menu's `AXSelectedChildren`, whose title, key and modifier mask `menu_keys.rs` already turns into keys.
- The event tap (which watches ⌘ for the trigger) tells a **choice** from a dismissal: a left mouse-up inside the highlighted item's frame (`AXPosition`, `AXSize`, read on mouse-up), or Return while the menu is open. Escape, or a click outside the menu, closes it without a choice. Rust then tells the frontend which app and which keys.
- The frontend matches the keys to the app's shortcuts on the current layout. A match counts one menu use for that shortcut; anything else is ignored.
- **What the spike found** (18.3, `examples/menu_events.rs`, Notes, VSCodium and Finder on macOS 27):
  - `AXMenuItemSelected` is **not** posted when an item is chosen with the mouse, in AppKit (Notes) or Electron (VSCodium) apps. AppKit apps post it when an item's **shortcut is pressed** with no menu open (Finder ⌘F, Notes ⌘A); VSCodium doesn't. So it can't count menu choices, and it can't count key presses either (18.6 keeps the event tap).
  - The highlighted item is readable in both kinds of app. Accessibility shows the same thing for a choice and for Escape: the last highlight, then `AXMenuClosed`. That's why the event tap decides.
  - Not tested yet, so checked in 18.4: Spotify, choosing with the keyboard (^F2, arrows, Return), and Help's menu search.

### 4.2 The banner

When a menu use matched a shortcut and **Show the shortcut when I use a menu** is on, a small panel at the top of the screen shows the shortcut's title and keys for about 2 seconds. It never takes focus or catches clicks, and a new one replaces the last.

### 4.3 Key presses

- Rust's event tap (which today watches ⌘ for the popover trigger) also watches key presses while the switch is on.
- The frontend gives Rust the learned shortcuts for each app on the current layout (bundle IDs, keys, card ID) and updates the list when progress or the layout changes.
- A press counts only if it matches a learned shortcut of the frontmost app. Nothing else is kept, logged or sent.

### 4.4 Storage

A new table (`migrations/0005_usage.sql`), kept per local day so it can be shown over time and deleted at once. Saving the settings with the switch off deletes every row, and so does resetting progress:

```sql
CREATE TABLE usage (
    shortcut_id TEXT NOT NULL,
    layout TEXT NOT NULL,
    day INTEGER NOT NULL,      -- local day number, as localDay counts it
    by_keys INTEGER NOT NULL DEFAULT 0 CHECK (by_keys >= 0),
    by_menu INTEGER NOT NULL DEFAULT 0 CHECK (by_menu >= 0),
    PRIMARY KEY (shortcut_id, layout, day)
) STRICT;
```

## 5. What you see

- **Your commands:** on an app's screen, above its sets, a set of the shortcuts you chose from that app's menus in the last 30 days, most-used first. It's learned like any other set and keeps its own progress. It appears once there is at least one.
- **The overview** gets a _By keyboard_ section while the switch is on: the share of uses done with the keys over 30 days, and the commands you still use the menu for most, each leading to its app.
- **Settings → General:** the switch, the banner setting under it, and a sentence on what's watched and stored.

## 6. Sub-steps

1. **18.1 Learning criterion:** the recalled-once stage and `recallsToLearn`.
2. **18.2 Relative grading:** the log rows carry card, duration and failure; typical times; `gradeRecall` with limits.
3. **18.3 Spike: menu choices.** A throwaway example (`src-tauri/examples/menu_events.rs`) that prints what macOS reports when menu items are highlighted and chosen. The result is in §4.1; 18.4 removes the example once the real observer exists.
4. **18.4 The switch and the coach:** the setting, the `usage` table, menu observation, matching, counting menu uses.
5. **18.5 The banner:** the panel and its setting.
6. **18.6 Key presses:** watched shortcuts sent to Rust, the event tap counting matches.
7. **18.7 What you see:** _Your commands_ and the overview's _By keyboard_ section.

Then the refactor round, the UML, the smoke test and _What we learned_, as for every step.
