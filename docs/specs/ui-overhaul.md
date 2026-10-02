# UI/UX overhaul

The spec for [#14](https://codeberg.org/gobin/mouseless/issues/14). Mouseless gets a look of its own: it sits well on a Mac but no longer looks like a system app. The references are **Halloy** (its default theme _Ferra_, Iosevka Term) and **Gram** (IBM Plex Sans, with the user's themes _Rosé Pine Dawn_ and _Gleam Dark_). Both draw their own interface, flat and dense, with warm muted surfaces and pastel accents that each carry a meaning.

The look was settled on a preview page with both themes side by side; this spec records it.

## 1. Decisions

| Decision  | Choice                                                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Direction | **Away from the native look**: no system materials, system blue or SF Pro; still a Mac window (traffic lights, system appearance, keyboard behaviour)         |
| Type      | **IBM Plex Sans** for text, **IBM Plex Mono** for keys, figures and small labels; modifier symbols (⌘ ⇧ ⌥ ⌃) in the system font                               |
| Palette   | **Our own light and dark**: a warm dark in Ferra's spirit and a paper light in Rosé Pine Dawn's, following the system appearance                              |
| Accents   | **One per meaning**: action, learned, mistake, due, info                                                                                                      |
| Frame     | **Our own flat title bar** with the traffic lights kept; no sidebar or popover glass                                                                          |
| Density   | **Compact frame and lists, generous practice**: chrome, sidebar, lists, popover and settings are dense; the practice stage gives the prompt and key caps room |

### The invariant this changes

`CLAUDE.md` says Mouseless follows macOS 27 (system colours, font and materials, measured against System Settings and Finder), from the _Native design_ step. That's replaced by:

> **A Mac app with its own look:** it behaves like a Mac app (window controls, system appearance, keyboard conventions, Settings window, menu bar) but draws its own interface from `tokens.css`: IBM Plex, its own palette and flat surfaces. A new surface is measured against this spec, not against the system's apps.

It changes with the first sub-step.

## 2. Tokens

All colours are roles in `src/styles/tokens.css`; components use the roles, never raw colours, as now. The user's system accent colour is no longer used.

| Role             | Dark            | Light                | Use                                                               |
| ---------------- | --------------- | -------------------- | ----------------------------------------------------------------- |
| `window`         | `#221f24`       | `#f4ede4`            | Title bar, sidebar, window background                             |
| `content`        | `#2a272c`       | `#faf5ee`            | The detail next to the sidebar, the practice stage                |
| `box`            | `#322e34`       | `#fffbf5`            | Grouped lists, figures, settings rows, the popover                |
| `raised`         | `#3c3740`       | `#fffdf9`            | Key caps, quiet buttons, the selected popover row, meter tracks   |
| `border`         | `#433d46`       | `#e3d9cc`            | Every hairline; borders replace shadows                           |
| `text`           | `#efe6e1`       | `#3f3547`            | Text                                                              |
| `text-secondary` | `#b3a6a8`       | `#6f6175`            | Secondary text, unselected sidebar rows                           |
| `text-tertiary`  | `#857a7e`       | `#8f8191`            | Labels, hints                                                     |
| `action`         | `#f6b593` peach | `#a94f29` terracotta | Main buttons, toggles, selection mark, focus ring, activity chart |
| `on-action`      | `#221f24`       | `#ffffff`            | Text on `action`                                                  |
| `learned`        | `#b4bd8f` sage  | `#56702f`            | Learned, correct, recall rate, progress meters                    |
| `mistake`        | `#ec7a85` rose  | `#b03f54`            | Wrong keys, errors                                                |
| `due`            | `#f2d16b` honey | `#8c600a`            | Due counts, trained stage                                         |
| `info`           | `#93d0b8` mint  | `#2a7366`            | Hints that aren't warnings; in `tokens.css` from its first use    |
| `key-edge`       | `#1a181c`       | `#d6cabb`            | The raised bottom edge of a key cap                               |

**Contrast** (WCAG, checked): text and every accent at least 4.5:1 on `content` and `box`; tertiary text at least 3:1 (labels and hints only); `on-action` on `action` at least 5:1.

**Type:**

| Use                                 | Font        | Size and weight                                                      |
| ----------------------------------- | ----------- | -------------------------------------------------------------------- |
| Body, rows, buttons                 | Plex Sans   | 13 px / 400, 500 for buttons; 12 px in the popover and settings rows |
| Screen titles                       | Plex Sans   | 17 px / 600                                                          |
| Section labels (`.caption`)         | Plex Mono   | 11 px / 500, uppercase, 0.08 em tracking, `text-tertiary`            |
| Figures (overview)                  | Plex Mono   | 19 px / 500                                                          |
| Keys in lists (popover, set screen) | Plex Mono   | 13 px / 500, `text`                                                  |
| Practice prompt                     | Plex Sans   | 30 px / 500                                                          |
| Practice key caps                   | Plex Mono   | 22 px / 500, caps 52 px high                                         |
| Modifier symbols                    | system font | the size of their surroundings, 500                                  |

The fonts are bundled as woff2 (Latin; Sans in 400, 500 and 600, Mono in 400 and 500) from Fontsource (`@fontsource/ibm-plex-sans`, `@fontsource/ibm-plex-mono`, OFL); IBM's own packages install a telemetry dependency. The CSP's `default-src 'self'` already allows them. The Latin files have no key symbols except ↑ and ↓, so `styles/fonts.css` leaves those two out of the range too: every key symbol then falls back to the system font, with no markup of its own.

**Shape and space:**

- Radii: 5 px for boxes and figures, 4 px for buttons, toggles and search fields, 6 px for key caps. No capsules.
- Spacing: a 4 px grid. A panel's edges have the same spacing on every side, and a panel's actions sit in its bottom-right corner, as far from the right edge as from the bottom.
- Controls have a fixed height (24 px for buttons), with their label centred in both directions by flex alignment, not by padding.
- Title bar: 32 px and quiet: the traffic lights centred in it, the app's name in small mono after them, and only a page's buttons (back, actions). Pages name themselves with a heading in their content.
- Sidebar: 176 px, rows about 24 px with 14 px logos; list rows 26 px; content padding 12 px on top, 14 px on the sides and bottom. The preview's CSS is the reference for sizes.

**Rendering:** text keeps WebKit's default smoothing; `antialiased` draws Plex visibly thinner than the preview did.

**Motion:** short and calm, 120–180 ms ease-out. A mistake shakes the key caps once (as now); a correct press outlines them in `learned` briefly. Everything is off under _Reduce motion_.

## 3. Surfaces

- **Frame:** the main and Settings windows lose the sidebar material and transparency (`windowEffects` and `transparent` go from the main window), with a flat 32 px title bar in `window` and the traffic lights repositioned into it.
- **Sidebar:** `window` background, rows in `text-secondary`; the selected row gets `box`, `text` and a 2 px `action` bar on its left edge. Section labels in the mono label style. Due counts in `due`, in mono.
- **Overview:** four figure boxes with values in mono (due in `due`, recall rate in `learned`) and labels in the label style below; activity bars in `action`; progress meters in `learned` on a `border` track, with counts in mono.
- **App and set screens:** the same lists and labels; shortcut keys in mono at full text colour.
- **Practice:**
  - A stage bar on top: one segment per shortcut, `border` for unseen, `due` for trained, `learned` for learned.
  - Above the bar, where the session is as a mono label (app · set · learn, or app · review); then the prompt and its description.
  - The footer counts in words what the bar shows (learned of all, or reviewed of due), for VoiceOver.
  - Key caps on `raised` with a hairline border and a 3 px `key-edge` bottom; `learned` outline when correct, `mistake` outline and colour after a mistake, next to the expected keys.
  - Skip stays a button, styled quiet. The preview showed keyboard hints (`esc` stop, `⇥` skip), but practice takes every key as an answer, and shortcuts use both keys (⌃⇥), so there are no such keys to show. Keys for them are a separate decision.
  - The stage keeps its generous spacing; the frame around it stays compact.
- **Popover:** an opaque `box` panel with a hairline border and 8 px radius instead of the system glass (the window stays transparent around it, so the corners round); a flat search field with a hairline; mono section labels; dense 20 px rows with keys right-aligned in mono.
- **Settings:** the same frame; rows as `box` lists; toggles square-ish (4 px) in `action`; buttons flat, the main one in `action`, the quiet one on `raised` with a border.
- **Focus ring:** 2 px `action` at 50 %, outside the element.
- **Icons:** the app logos stay; the line icons (`BaseIcon`) take `text-secondary`, and the overview icon `action`.

## 4. Sub-steps

1. **14.1 Tokens and fonts:** the new `tokens.css`, the bundled Plex fonts, `base.css` (body type, focus ring), and the invariant updated in `CLAUDE.md`.
2. **14.2 Frame and sidebar:** window config (no effects or transparency, traffic lights), title bar, sidebar.
3. **14.3 Lists, overview, app and set screens:** shared components (`GroupedList`, `NavigationRow`, `PageLayout`, `ListSection`, `BaseButton`, meters, chart).
4. **14.4 Practice:** stage bar, prompt, key caps, feedback, skip.
5. **14.5 Popover:** the opaque panel, search, rows.
6. **14.6 Settings window:** rows, toggles, buttons, the trigger recorder.

Each sub-step is checked in both appearances by the user (screenshots aren't possible from here), then the refactor round, the UML (only if structure changed), the smoke test and _What we learned_.
