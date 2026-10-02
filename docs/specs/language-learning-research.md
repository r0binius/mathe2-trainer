# Language learning: research

What the research says about learning a language, and what that means for a language app built on the trainer core ([#15](https://codeberg.org/gobin/mouseless/issues/15)). This is the input for `trainer-core.md`: the core has to carry what the language app needs, and the app's own design starts from here.

Each finding is marked by how firm it is:

- **Strong:** several meta-analyses agree.
- **Moderate:** one meta-analysis, or consistent studies with open questions.
- **Weak:** few or mixed studies, a theory more than a result, or claims from practice (such as language-learning forums) that research hasn't tested.

## 1. Memory

These hold for any material, so they matter for all three trainers.

| Finding                 | Firmness | What it says                                                                                                                                                                                                                                                                                                                                |
| ----------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Retrieval practice**  | Strong   | Recalling an answer beats re-reading it: Rowland (2014) finds g ≈ 0.50–0.61, larger with feedback; Adesope et al. (2017) find practice tests beat restudy and every other comparison, best with a lag of one to six days before the final test. Dunlosky et al. (2013) rate practice testing as one of only two techniques of high utility. |
| **Spacing**             | Strong   | Spreading reviews out beats massing them: about 15 % more retention on average (Cepeda et al., 2006, 839 assessments). The best gap grows with how long the material must be kept. Kim & Webb (2022) confirm it for second-language learning (37 studies), with effects that vary by skill and activity.                                    |
| **Scheduler**           | Moderate | FSRS predicts recall better than SM-2 (log loss 0.29 vs 0.35 on hundreds of millions of Anki reviews, in the open benchmark). This is predictive accuracy, not a learning-outcome study, but it means the schedule hits the intended retention more closely. Mouseless already uses FSRS.                                                   |
| **Interleaving**        | Moderate | Mixing items of different categories helps when the categories are similar and easily confused (g ≈ 0.42; Brunmair & Richter, 2019). For words, this argues against learning near-synonyms or minimal pairs in separate blocks.                                                                                                             |
| **Errorful generation** | Moderate | Guessing before seeing the answer helps, even when nearly every guess is wrong, as long as feedback follows (Potts & Shanks, 2014, with foreign vocabulary). A new item can be asked before it's shown.                                                                                                                                     |
| **Feedback**            | Strong   | Retrieval needs feedback to correct errors (a moderator in Rowland, 2014). In language learning, corrective feedback has a medium effect (Li, 2010), durable in classrooms (Lyster & Saito, 2010); explicit feedback works faster, implicit feedback lasts longer.                                                                          |

**For the core:** test, don't show (as Mouseless already does); schedule with FSRS; always show the correct answer after a mistake; let a session mix sets; allow testing an item before it's taught.

## 2. What to learn: frequency and coverage

A few words make up most of any text, so learning by frequency pays off fastest. Coverage is the share of running words in a text that the learner knows.

| Words known (families) | Written text                | Spoken text                                                                |
| ---------------------- | --------------------------- | -------------------------------------------------------------------------- |
| 1,000                  | 72 %                        |                                                                            |
| 2,000                  | 80 %                        | about 95 % (Adolphs & Schmitt, 2003, at 2,000–3,000); 96 % in older counts |
| 3,000                  | 84 %                        |                                                                            |
| 4,000–5,000            | 95 %: minimal comprehension |                                                                            |
| 6,000–7,000            |                             | 98 %: unassisted listening                                                 |
| 8,000–9,000            | 98 %: unassisted reading    |                                                                            |

Written figures from Nation & Waring (1997) on the Brown Corpus; thresholds from Laufer & Ravenhorst-Kalovski (2010) and Nation (2006).

**Strong** for English; other languages have their own counts, and inflected languages count differently. A word family is the word with its inflections and common derivations (_go, goes, went, going_), so 2,000 families are several thousand forms.

What this means for "the 2,000 most common words":

- It's the right first goal, and for speech it's nearly enough to follow everyday conversation (95 %).
- For reading it's not: at 80 %, one word in five is unknown, too many to follow a text or to guess words from context. Reading on your own needs 95 % (4,000–5,000 families), and comfortably 98 %.
- So the app moves from deliberate learning (frequency lists) to reading and listening as soon as the material reaches 95 % coverage, and coverage tells which texts are ready.

**For the core:** sets ordered by frequency, so learning follows rank. **For the app:** frequency lists per language (such as SUBTLEX, from film subtitles), word families or lemmas rather than forms, and a way to measure a text's coverage against what the learner knows.

## 3. How words are learned

| Finding                                       | Firmness | What it says                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Deliberate learning is efficient**          | Strong   | Studying word cards and word pairs gives large gains for the time spent (Webb, Yanagisawa & Uchihara, 2020, on intentional vocabulary learning). It's the fastest way through the high-frequency words.                                                                                                                                  |
| **Incidental learning needs many encounters** | Moderate | Words are picked up from reading and listening, but slowly: repetition correlates only moderately with gains (r = .34; Uchihara, Webb & Yanagisawa, 2019), and studies disagree on how many encounters it takes (from 2 to more than 20). Reading alone is too slow for the first thousands of words; it's what deepens them afterwards. |
| **Glosses help reading**                      | Strong   | Reading with glosses roughly doubles the words learned (45 % vs 27 % immediately, 33 % vs 20 % delayed). L1 glosses beat L2 glosses, and multiple-choice glosses, where the reader picks the meaning, work best (Yanagisawa, Webb & Uchihara, 2020).                                                                                     |
| **One sentence adds little**                  | Moderate | Learning a word in a single example sentence gives about the same knowledge as a word pair (Webb, 2007). A sentence is valuable as a source (where the word was met, its collocations and grammar), not because one context teaches more on its own.                                                                                     |
| **Direction matters**                         | Moderate | What is practised is what is learned: recognising (L2 → L1) builds mostly receptive knowledge, producing (L1 → L2) builds productive knowledge and also helps recognition (Webb, 2009). Beginners do better starting receptive; more advanced learners profit more from productive practice.                                             |
| **Effortful tasks stick**                     | Moderate | Tasks that make the learner need, search for and evaluate a word (involvement load; Laufer & Hulstijn, 2001) work better; Nation & Webb's (2011) technique feature analysis predicts outcomes better, adding retrieval, generation and spacing.                                                                                          |
| **Multiword units**                           | Moderate | Collocations and set phrases are learned slowly and are a large part of fluent language. They can be learned like words, and from reading when met often in a short span (Boers & Webb, 2018).                                                                                                                                           |
| **Keyword mnemonics**                         | Weak     | They help for short-term recall but are rated of low utility overall (Dunlosky et al., 2013). An optional note per card, not a method.                                                                                                                                                                                                   |

**For the core:** an item can be practised in more than one direction, each with its own memory (a card per direction); typed recall as well as recognition; items longer than a word (phrases, sentences); a note per item.

## 4. Grammar

**Strong:** explicit instruction works and lasts. Instruction beats exposure alone (Norris & Ortega, 2000), and explicit instruction beats implicit for simple and complex structures, builds implicit knowledge too, and lasts on delayed tests (Spada & Tomita, 2010). The caveat is that early studies measured mostly explicit knowledge.

**For the app:** short grammar explanations linked to the patterns they explain, and pattern items practised like words (fill in the right form in a sentence). **For the core:** a cloze answer (a gap in a sentence) as an answer kind.

## 5. Input and output

| Finding                  | Firmness                        | What it says                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------ | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Comprehensible input** | Moderate                        | Krashen's comprehension hypothesis says language is acquired by understanding messages slightly above one's level. Extensive reading programs show medium to large gains in vocabulary and reading in several meta-analyses, though results depend heavily on program design. As a theory it's hard to test ("slightly above" isn't defined), but the coverage research (§2) gives it a measurable form: 95–98 %. |
| **Output**               | Moderate                        | Producing language makes learners notice gaps (Swain's output hypothesis). Nation's four strands give meaning-focused output an equal share.                                                                                                                                                                                                                                                                      |
| **The four strands**     | Moderate, as a design principle | Nation's balance: meaning-focused input, meaning-focused output, language-focused learning, and fluency development, each about a quarter of the time. Flashcards are only the third strand.                                                                                                                                                                                                                      |
| **Listening**            | Moderate                        | Extensive listening helps beginners and intermediate learners; shadowing (repeating audio just behind the speaker) helps pronunciation, prosody and bottom-up listening (systematic reviews, no meta-analysis yet).                                                                                                                                                                                               |
| **Pronunciation**        | Strong                          | High-variability phonetic training (hearing many speakers, identifying sounds) improves perception (g = 0.92 pre/post, 0.67 against controls, 79 studies), lasts, and transfers somewhat to production.                                                                                                                                                                                                           |

**For the core:** audio as a prompt; choice answers (identifying a sound from a few options). **For the app:** a reader and a listener with coverage, both feeding new items into the trainer.

## 6. Fluency and speed

**Moderate:** speed of recall shows how automatic it is. Segalowitz's work uses reaction time and its variability (the coefficient of variation) as measures of automatic word recognition, though longitudinal studies don't always find the effect. Nation's fluency strand practises material that's already known, under time pressure.

**For the core:** grading by time, as Mouseless does, but relative to what the answer demands: typing a sentence takes longer than pressing a shortcut, so the limits depend on the answer's length (and on the learner's typing speed).

## 7. Sentence mining

Sentence mining means collecting sentences from real material (books, series, articles) that contain exactly one unknown word, and turning them into cards. It comes from learning communities (it's often described as "i+1"), not research, so it's **weak** as a method. Its parts are supported:

- Material with one unknown word is at about 95–98 % coverage (§2), the level research recommends.
- Learning a word you met and wanted to know is high involvement (need, search; §3).
- Deliberate review of the mined word is retrieval practice with spacing (§1).
- What's not supported is that the sentence itself teaches more than a word pair (Webb, 2007). The sentence keeps the source and context, and it can be tested as a cloze or as a recognition card.

## 8. Existing apps

Evidence for commercial apps is thin and mostly commissioned. Duolingo's early study (Vesselinov & Grego, 2012) was paid for by the company; a 2024 study found gains in all skills after about 27 hours. Independent reviews point to problems with persistence and motivation more than method. There's room for an app that applies the research above directly.

## 9. What the language app needs from the core

Each line is traced to a section above. `trainer-core.md` decides which of these the core provides and which the app adds.

| Need                                                                                    | Why              | Mouseless today                      |
| --------------------------------------------------------------------------------------- | ---------------- | ------------------------------------ |
| Test before showing, with feedback after a mistake                                      | §1               | Yes                                  |
| FSRS scheduling per item                                                                | §1               | Yes                                  |
| Mixed sets in one session                                                               | §1 interleaving  | No: one set or one app at a time     |
| Several cards per note (directions, cloze), each with its own memory                    | §3 direction, §4 | No: one card per shortcut            |
| Answer kinds: keys, typed text, cloze, choice                                           | §3–5             | Keys only                            |
| Typed answers checked with tolerance (case, accents, typos)                             | §3               | No                                   |
| Prompts with audio and images                                                           | §5               | Text only                            |
| Items longer than a word                                                                | §3 multiword     | Titles only                          |
| Grading by time relative to the answer's length                                         | §6               | Fixed limits (2 s, 6 s)              |
| Sets ordered by frequency                                                               | §2               | Sets in authored order               |
| Content created by the user (mined, imported)                                           | §7               | No: content is compiled into the app |
| Content from large lists (thousands of items)                                           | §2               | About 500 shortcuts in total         |
| Progress per learning direction or language pair, the way Mouseless keeps it per layout | §3               | Per keyboard layout                  |
| The overview: due, reviewed, recall rate, streak, activity                              | §1               | Yes (#13)                            |

## 10. A draft design for the language app

A first sketch to argue over, not a decision. It follows the four strands.

- **Learn (language-focused):** frequency sets per language (the top 2,000, then up to 5,000 and 9,000), a short vocabulary-size test to skip what's known, word cards practised receptive first and productive once known, cloze cards from mined sentences, collocation and grammar-pattern cards with short explanations.
- **Read and listen (meaning-focused input):** texts and transcribed audio sorted by coverage, with the unknown words marked; tap a word for an L1 gloss (or pick its meaning from a few choices); mine it into a card with its sentence and source.
- **Write and speak (meaning-focused output):** prompts that use recently learned words. Checking free text needs a language model or a teacher, which is a decision of its own (privacy, cost, offline use).
- **Fluency:** timed reading of easy texts and speeded recognition of known words, measuring time and its variability.
- **Pronunciation:** minimal-pair listening with several speakers (high-variability training), and shadowing with recordings.

Open questions for that app, not for the core:

- Languages and where the frequency lists, glosses and audio come from (licences).
- How texts get in: imports (EPUB, subtitles, web pages) or a curated library.
- Whether free-text checking uses a language model, which one, and whether it runs locally.
- Lemmatising per language (word families vs. inflected forms).

## Sources

- Adesope, Trevisan & Sundararajan (2017). [Rethinking the use of tests: a meta-analysis of practice testing](https://journals.sagepub.com/doi/10.3102/0034654316689306). _Review of Educational Research_ 87(3).
- Adolphs & Schmitt (2003), lexical coverage of spoken discourse, as summarised in [Schmitt, Cobb et al. (2015)](https://www.lextutor.ca/cover/papers/schmitt_cobb_etal_2015.pdf).
- Boers & Webb (2018). [Teaching and learning collocation in adult second and foreign language learning](https://www.cambridge.org/core/journals/language-teaching/article/teaching-and-learning-collocation-in-adult-second-and-foreign-language-learning/A950F8F80BDD64E02D3F6052BA705478). _Language Teaching_.
- Brunmair & Richter (2019). [Similarity matters: a meta-analysis of interleaved learning and its moderators](https://www.psychologie.uni-wuerzburg.de/fileadmin/06020400/2019/Brunmair_Richter_in_press__2019_META-ANALYSIS_OF_INTERLEAVED_LEARNING.pdf). _Psychological Bulletin_.
- Cepeda, Pashler, Vul, Wixted & Rohrer (2006). [Distributed practice in verbal recall tasks](https://pubmed.ncbi.nlm.nih.gov/16719566/). _Psychological Bulletin_ 132.
- Dunlosky et al. (2013). [Improving students' learning with effective learning techniques](https://www.sciencedaily.com/releases/2013/01/130110111734.htm). _Psychological Science in the Public Interest_.
- Kim & Webb (2022). [The effects of spaced practice on second language learning: a meta-analysis](https://doi.org/10.1111/lang.12479). _Language Learning_.
- Laufer & Hulstijn (2001), involvement load; Nation & Webb (2011), technique feature analysis: see [this review](https://pmc.ncbi.nlm.nih.gov/articles/PMC11258005).
- Laufer & Ravenhorst-Kalovski (2010). [Lexical threshold revisited](https://nflrc.hawaii.edu/rfl/item/206). _Reading in a Foreign Language_ 22(1).
- Li (2010). The effectiveness of corrective feedback in SLA: a meta-analysis. _Language Learning_ 60(2); [summary](https://researchspace.auckland.ac.nz/handle/2292/24985?show=full).
- Lyster & Saito (2010). [Oral feedback in classroom SLA: a meta-analysis](https://resolve.cambridge.org/core/journals/studies-in-second-language-acquisition/article/oral-feedback-in-classroom-sla/4999EE1C8379B2BF026B148EAF373CA1). _Studies in Second Language Acquisition_ 32(2).
- Nation (2006). [How large a vocabulary is needed for reading and listening?](https://www.wgtn.ac.nz/__data/assets/pdf_file/0018/1626120/2006-How-large-a-vocab.pdf) _Canadian Modern Language Review_.
- Nation & Waring (1997). [Vocabulary size, text coverage and word lists](https://lextutor.ca/research/nation_waring_97.html).
- Nation's four strands: [a paper by Nation](https://cunningham.acer.edu.au/inted/eaconf95/nation2.pdf) and [an overview](https://en.wikipedia.org/wiki/Paul_Nation).
- Norris & Ortega (2000) and Spada & Tomita (2010) on explicit instruction: [discussion](https://journals.library.columbia.edu/index.php/SALT/article/view/1530) and [summary](https://caslsintercom.uoregon.edu/content/23177).
- Open spaced repetition benchmark: [FSRS vs SM-2](https://www.lesswrong.com/posts/G7fpGCi8r7nCKXsQk/the-history-of-fsrs-for-anki).
- Potts & Shanks (2014). [The benefit of generating errors during learning](https://discovery-pp.ucl.ac.uk/id/eprint/1426443). _Journal of Experimental Psychology: General_.
- Rowland (2014). [The effect of testing versus restudy on retention](https://courseware.epfl.ch/assets/courseware/v1/fdde2f0aa590bf3b1324077a6bf1540c/asset-v1%3AEPFL%2BDEMO%2B2020%2Btype%40asset%2Bblock/Rowland2014-meta-analysis.pdf). _Psychological Bulletin_ 140(6).
- Segalowitz on automaticity and the coefficient of variation: [research timeline](https://resolve.cambridge.org/core/journals/language-teaching/article/research-timeline-automatization-in-second-language-learning/30C96770C708A4A9513570F47F40F054).
- Shadowing: [Hamada (2018)](https://journals.sagepub.com/doi/10.1177/0033688218771380); extensive listening: [Karlin](https://benjamins.com/catalog/aila.22015.kar).
- High-variability phonetic training: [meta-analysis of 79 studies](https://resolve.cambridge.org/core/journals/studies-in-second-language-acquisition/article/high-variability-phonetic-training-hvpt-a-metaanalysis-of-l2-perceptual-training-studies/6ABB8C1F32D88D53EA8D05A4565E76F6/core-reader); [perception and production](https://www.cambridge.org/core/product/E38D8F5CE65DC708137B0E95F97C6BC7).
- Uchihara, Webb & Yanagisawa (2019). [The effects of repetition on incidental vocabulary learning](https://www.cambridge.org/core/product/E38E3468FD2090B1FA3051051DE8E70C). _Language Learning_.
- Vesselinov & Grego (2012), Duolingo, and a 2024 study: [report](https://rebrand.avantassessment.com/wp-content/uploads/The-effectiveness-of-Duolingo-in-developing-receptive-and-productive-language-knowledge-and-proficiency.pdf).
- Webb (2007). [Learning word pairs and glossed sentences](https://ir.wgtn.ac.nz/handle/123456789/23701). _Language Teaching Research_ 11(1).
- Webb (2009). The effects of receptive and productive learning of word pairs on vocabulary knowledge. _RELC Journal_ 40(3).
- Webb, Yanagisawa & Uchihara (2020). How effective are intentional vocabulary learning activities? A meta-analysis. _Modern Language Journal_ 104(4).
- Yanagisawa, Webb & Uchihara (2020). [How do different forms of glossing contribute to L2 vocabulary learning from reading?](https://cambridge.org/core/journals/studies-in-second-language-acquisition/article/how-do-different-forms-of-glossing-contribute-to-l2-vocabulary-learning-from-reading/38124150D59DF3039EE1FF5AE88FE922) _Studies in Second Language Acquisition_ 42(2).
