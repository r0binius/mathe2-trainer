# Shortcut learning: research

What the research says about learning keyboard shortcuts, and how well Mouseless follows it. The companion to `language-learning-research.md`, with the same markers (**strong**, **moderate**, **weak**) and the same purpose: show which parts of the trainer rest on evidence, which are heuristics, and what the trainer core ([#15](https://codeberg.org/gobin/mouseless/issues/15)) should leave room for.

## What learning a shortcut is

Learning a shortcut takes three things, each studied by a different field:

1. **Remembering the pairing** of a command and its keys ("Save" → ⌘S). This is paired-associate learning, the same kind of memory as vocabulary, so the general memory research applies directly (§2).
2. **Pressing it fluently:** a small motor skill, a chord of modifiers and a key, found and pressed without thinking. Motor-learning research applies, though its tasks (tracking, timing, sports) are further from a shortcut (§3).
3. **Using it at work** instead of the menu. Human-computer interaction (HCI) research studies this, mostly in small lab studies (§4).

No study tests a standalone shortcut trainer like Mouseless directly. Its design is therefore an application of the three bodies of research above, and the weakest link is the third: whether practice in Mouseless turns into shortcut use in the apps.

## 1. Why train shortcuts at all

| Finding                              | Firmness | What it says                                                                                                                                                                                                                                                                                                         |
| ------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Shortcuts are faster, yet unused** | Moderate | Most of 251 experienced Word users rarely used shortcuts, though a timed test confirmed shortcuts were the fastest way to issue commands (Lane et al., 2005).                                                                                                                                                        |
| **Knowing isn't enough**             | Moderate | Users often don't use shortcuts they know, even under time pressure; they settle for the method that is good enough ("satisficing"). Tools that help learn shortcuts raise their use (Tak, Westendorp & van Rooij, 2013).                                                                                            |
| **Switching costs a dip**            | Moderate | Moving to a faster method makes users slower at first, which is why many never switch; interfaces that ease the dip help (Scarr et al., 2011). Cockburn et al. (2014) survey the field: getting faster with one method, switching to a method with a higher ceiling (menus → shortcuts), and learning more commands. |

**For Mouseless:** the problem it solves is real and documented. Practising outside the work is one way across the dip, since the slow first attempts happen where speed doesn't matter.

## 2. Memory

The general findings from `language-learning-research.md` §1 hold here: retrieval practice, spacing, feedback after mistakes, interleaving (all strong or moderate). How Mouseless applies them:

| Practice in Mouseless                                                     | Research                                                                                                                                                              | Verdict                                                      |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| A shortcut is shown once, then tested with the keys hidden                | Retrieval practice beats restudy (Rowland, 2014; Adesope et al., 2017)                                                                                                | Sound                                                        |
| After a mistake, the right keys are shown and must be pressed             | Feedback is a key moderator of the testing effect (Rowland, 2014)                                                                                                     | Sound                                                        |
| FSRS schedules reviews, aiming at 90 % recall                             | Spacing (Cepeda et al., 2006); FSRS predicts recall well (open benchmark)                                                                                             | Sound                                                        |
| The user never rates themselves; mistakes and time decide the grade       | Self-ratings are biased; measured recall isn't                                                                                                                        | Sound in principle; the time limits are heuristics (§3)      |
| A shortcut counts as learned after **one** correct press without the keys | Vaughn & Rawson (2011) recommend three correct recalls at first, then three spaced relearning sessions; the effect of the first criterion fades as relearning goes on | Below the recommendation, partly made up for by FSRS reviews |

**Learning criterion** (moderate): one correct recall in a session is a low bar. Since spaced relearning outweighs the first criterion, the cost is mainly early forgetting, which FSRS then catches as a failed review. Requiring two or three correct recalls before "learned" is a cheap change worth testing.

## 3. Motor skill and speed

| Finding                             | Firmness           | What it says                                                                                                                                                                                                                                             |
| ----------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stages of skill**                 | Strong, as a model | Skills move from a cognitive stage (thinking each step) through an associative stage to an autonomous one (Fitts & Posner, 1967). A shortcut pressed without thinking is the autonomous stage, and speed is its sign.                                    |
| **Practice speeds up steadily**     | Strong             | Time falls with practice, steeply at first, then slowly: a power law on averaged data (Newell & Rosenbloom, 1981), better described as exponential per person (Heathcote, Brown & Mewhort, 2000). A response time says where a learner is on that curve. |
| **Random order beats blocks**       | Moderate           | Practising related skills in random order slows practice but improves retention (contextual interference, Shea & Morgan, 1979). The effect is medium in the lab (d = 0.57) and small in applied settings (d = 0.19; Brady, 2004).                        |
| **Spaced practice for motor tasks** | Strong             | Spaced practice beats massed practice (d = 0.46, 63 studies; Donovan & Radosevich, 1999), with effects that depend on the task.                                                                                                                          |
| **Fading guidance**                 | Moderate           | Feedback or guidance on every trial makes learners depend on it; reducing it helps retention (the guidance hypothesis; Salmoni, Schmidt & Walter, 1984).                                                                                                 |

How Mouseless applies them:

- **Random order:** learning picks the next shortcut by weighted chance (unseen 90, trained 50, learned 10), never in blocks. Sound.
- **Fading guidance:** keys are shown until the first correct press, then hidden. Sound.
- **Grading by time:** under 2 s is `easy`, over 6 s is `hard`. Using time is sound (it tracks the skill curve), but the two limits come from the old app and the rewrite, not from research. A shortcut with three modifiers takes longer to press than ⌘C, and people differ in speed. Limits relative to the learner's own times (for example, compared with their median for shortcuts of the same length) would be better founded. **Weak** as they stand.

## 4. From practice to use

| Finding                            | Firmness               | What it says                                                                                                                                                                                                                                 |
| ---------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Practise the real act**          | Strong, as a principle | Memory is best when practice and use involve the same processing (transfer-appropriate processing; Morris, Bransford & Franks, 1977).                                                                                                        |
| **Reminders at the moment of use** | Moderate               | In a lab task, saying the hotkey aloud after a menu selection raised hotkey use from 29 % to 67 %, and disabling the menu items raised it to 73 %. Frequent commands made the transition sooner (Grossman, Dragicevic & Balakrishnan, 2007). |
| **Rehearsing the expert action**   | Moderate               | Showing the hotkeys over the commands while a modifier is held lets novices press them, rehearsing the expert action; users used more hotkeys and were faster with it (ExposeHK; Malacria et al., 2013).                                     |
| **Coaching during work**           | Weak                   | Training inserted into the flow of work, about the commands just used, helps users past the "active user paradox" (busy users don't stop to learn; Krisler & Alterman, 2008).                                                                |

How Mouseless applies them:

- **Practise the real act:** practice is pressing the real keys, on the user's own keyboard layout, with progress kept per layout. This is the closest match to use a trainer can offer, and better than typing or picking key names. Sound.
- **Moment of use:** the lookup popover shows the shortcuts of the app in front, while working. It's a step towards ExposeHK, though it shows a list rather than overlays on the commands.
- **The gap:** nothing connects practice to the commands the user actually reaches for with the mouse, and nothing shows whether practice turns into use. Two ideas follow from §4, both for later:
  - **A coach:** notice when a command is chosen from a menu (macOS Accessibility probably reports menu selections; to be checked), then offer its shortcut, or add it to practice. This is the Grossman et al. and HotKeyCoach approach, using permissions Mouseless already has.
  - **Usage as feedback:** count (locally, opt-in) how often learned shortcuts are pressed in their apps, so the overview can show transfer, not only recall. The event tap already sees key presses, so this is a privacy decision more than a technical one.
- **What to learn first:** frequent commands make the switch sooner (Grossman et al., 2007), so sets can put the most-used commands first, the shortcut version of learning by frequency (`language-learning-research.md` §2).

## 5. Verdict

Mouseless's core loop is scientifically sound. It tests rather than shows, schedules with FSRS, grades by measured recall, practises in random order, fades the guidance, and practises the real keys on the real layout. Each of these rests on strong or moderate evidence. Three parts are heuristics or gaps:

| Part                               | Status                   | Possible change                                                   |
| ---------------------------------- | ------------------------ | ----------------------------------------------------------------- |
| Time limits for grading (2 s, 6 s) | Heuristic                | Limits relative to the learner's own times and the number of keys |
| Learned after one correct recall   | Below the recommendation | Two or three correct recalls in a session                         |
| Transfer to real use               | Not addressed            | A coach that reacts to menu use; usage counts in the overview     |

None of these is needed for #15. What #15 takes from this:

- **Grading is a strategy per trainer** with access to the learner's past times, so relative limits can replace fixed ones without touching the core.
- **The learning criterion is a parameter** of the learning flow, not a constant.
- **Item order within a set can follow frequency or usefulness**, as for words.
- **The in-context parts** (popover, a future coach, usage counts) stay in the shortcut part; the terminal trainer may have its own equivalent (a shell hook), the language app has none.

## Sources

- Adesope, Trevisan & Sundararajan (2017). [Rethinking the use of tests: a meta-analysis of practice testing](https://journals.sagepub.com/doi/10.3102/0034654316689306). _Review of Educational Research_ 87(3).
- Brady (2004). [Contextual interference: a meta-analytic study](https://www.gwern.net/docs/spaced-repetition/2004-brady.pdf). _Perceptual and Motor Skills_ 99.
- Cepeda, Pashler, Vul, Wixted & Rohrer (2006). [Distributed practice in verbal recall tasks](https://pubmed.ncbi.nlm.nih.gov/16719566/). _Psychological Bulletin_ 132.
- Cockburn, Gutwin, Scarr & Malacria (2014). [Supporting novice to expert transitions in user interfaces](https://www.springerprofessional.de/doi/10.1145/2659796). _ACM Computing Surveys_ 47(2).
- Donovan & Radosevich (1999). [A meta-analytic review of the distribution of practice effect](https://www.gwern.net/docs/spaced-repetition/1999-donovan.pdf). _Journal of Applied Psychology_ 84.
- Fitts & Posner (1967). _Human Performance_. Brooks/Cole.
- Grossman, Dragicevic & Balakrishnan (2007). [Strategies for accelerating on-line learning of hotkeys](https://www.dgp.toronto.edu/~ravin/papers/chi2007_learninghotkeys.pdf). _CHI 2007_.
- Heathcote, Brown & Mewhort (2000). [The power law repealed: the case for an exponential law of practice](https://link.springer.com/article/10.3758/BF03196105). _Psychonomic Bulletin & Review_ 7.
- Krisler & Alterman (2008). [Training towards mastery: overcoming the active user paradox](https://scholarworks.brandeis.edu/esploro/outputs/conferenceProceeding/Training-towards-mastery-overcoming-the-active/9924086775001921). _NordiCHI 2008_.
- Lane, Napier, Peres & Sándor (2005). Hidden costs of graphical user interfaces: failure to make the transition from menus and icon toolbars to keyboard shortcuts. _International Journal of Human-Computer Interaction_ 18(2).
- Malacria, Bailly, Harrison, Cockburn & Gutwin (2013). [Promoting hotkey use through rehearsal with ExposeHK](https://hal.archives-ouvertes.fr/hal-01894253). _CHI 2013_.
- Morris, Bransford & Franks (1977). Levels of processing versus transfer appropriate processing. _Journal of Verbal Learning and Verbal Behavior_ 16; [overview](https://en.wikipedia.org/wiki/Transfer-appropriate_processing).
- Newell & Rosenbloom (1981). Mechanisms of skill acquisition and the law of practice; [overview](https://en.wikipedia.org/wiki/Power_law_of_practice).
- Open spaced repetition benchmark: [FSRS vs SM-2](https://www.lesswrong.com/posts/G7fpGCi8r7nCKXsQk/the-history-of-fsrs-for-anki).
- Rowland (2014). [The effect of testing versus restudy on retention](https://courseware.epfl.ch/assets/courseware/v1/fdde2f0aa590bf3b1324077a6bf1540c/asset-v1%3AEPFL%2BDEMO%2B2020%2Btype%40asset%2Bblock/Rowland2014-meta-analysis.pdf). _Psychological Bulletin_ 140(6).
- Salmoni, Schmidt & Walter (1984), the guidance hypothesis; [review](https://www.frontiersin.org/journals/neuroscience/articles/10.3389/fnins.2016.00251/full).
- Scarr, Cockburn, Gutwin & Quinn (2011). Dips and ceilings: understanding and supporting transitions to expertise in user interfaces. _CHI 2011_, [doi:10.1145/1978942.1979348](https://doi.org/10.1145/1978942.1979348).
- Shea & Morgan (1979), contextual interference; see Brady (2004).
- Tak, Westendorp & van Rooij (2013). [Satisficing and the use of keyboard shortcuts: being good enough is enough?](https://research.tue.nl/nl/publications/satisficing-and-the-use-of-keyboard-shortcuts-being-good-enough-i/) _Interacting with Computers_ 25(5).
- Vaughn & Rawson (2011). Diagnosing criterion-level effects on memory. _Psychological Science_ 22; [summary](https://archive.memory-key.com/node/2463).
