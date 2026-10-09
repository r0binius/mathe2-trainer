# Mathe 2 – Prüfungstrainer

Ein Lerntrainer für die Vorlesung Mathematik 2 (Kapitel 7 bis 13 des Skripts): Definitionen, Sätze,
Wahr-oder-falsch-Aussagen und Klausuraufgaben mit Musterlösung, dazu Wiederholung in wachsenden
Abständen, Nachschlagen und eine Prüfungssimulation.

Entstanden aus dem Tastaturkürzel-Trainer Mouseless: Lernablauf (erst zeigen, dann abfragen, bis es
zweimal sitzt), Wiederholungsplanung (FSRS), Architektur und Aussehen sind übernommen. Die macOS-Hülle
(Tauri, Rust, Menüleiste, Tastatur-Hooks) ist entfallen – der Trainer ist jetzt eine Web-App, die als
eine einzige HTML-Datei gebaut wird und auch auf dem Handy läuft.

## Was drin ist

| Bereich          | Was er tut                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------ |
| Lernen           | Pro Kapitel vier Decks. Neue Definitionen und Sätze werden gezeigt, dann abgefragt.        |
| Wiederholen      | Was gewusst wurde, kommt nach FSRS wieder: kurz vor dem Vergessen.                         |
| Wahr oder falsch | Aussagen beurteilen, mit Begründung oder Gegenbeispiel. Wird automatisch bewertet.         |
| Aufgaben         | Klausurnahe Aufgaben (viele von den Übungsblättern) mit Tipp und Musterlösung.             |
| Nachschlagen     | Volltextsuche über alles, mit Filter nach Kapitel und Art.                                 |
| Prüfung          | Zufällige Aufgaben auf Zeit, danach Selbstkorrektur mit Punkten und Auswertung je Kapitel. |
| Tutor (optional) | Als veröffentlichtes Claude-Artifact: eigene Antwort prüfen oder etwas erklären lassen.    |

Alles lässt sich mit der Tastatur bedienen (Leertaste, 1–4, W/F, T, S, Esc); die Tasten stehen an den
Knöpfen und in den Einstellungen.

## Inhalte ergänzen

Ein Kapitel ist eine Datei in `src/data/topics/`. Texte sind Rich Text: Absätze durch Leerzeilen,
Listen mit `- `, `**fett**`, Formeln als TeX zwischen `$…$` oder `$$…$$`. Die Texte stehen in
`String.raw`, damit Backslashes nicht verdoppelt werden müssen – deshalb darf im Text nie `${` stehen.

`pnpm test` rendert jede Formel einmal mit MathJax und schlägt fehl, wenn eine nicht lesbar ist oder
eine ID doppelt vorkommt. IDs nicht nachträglich ändern: der Fortschritt hängt an ihnen.

## Aufbau

```
src/
├─ domain/      rein funktional, ohne Vue: content (Typen, Suche, Rich Text), practice (Sitzung als
│               Elm-Modell, Lern- und Wiederholstrategie), scheduling (FSRS), progress, exam
├─ data/        die Kapitel
├─ platform/    MathJax, Speicher (localStorage, im Artifact zusätzlich pro Konto), Tutor
├─ stores/      Pinia: Fortschritt
├─ composables/ useProgram (Elm-Laufzeit), usePracticeSession, useHotkeys
├─ features/    library, practice, lookup, exam, settings
└─ components/  Bausteine ohne eigene Logik
```

## Befehle

| Befehl       | Zweck                                       |
| ------------ | ------------------------------------------- |
| `pnpm dev`   | Entwicklungsserver                          |
| `pnpm build` | baut `dist/index.html`, eine einzelne Datei |
| `pnpm check` | Format, Lint, Typen und Tests               |

## Mitarbeiten

Fehler im Material oder Ideen? [CONTRIBUTING.md](CONTRIBUTING.md) erklärt den Weg über Fork und Pull
Request. Wie der Trainer lokal läuft, veröffentlicht wird und was man beim Fortschritt und beim Sync
nicht kaputtmachen darf, steht in [docs/entwicklung.md](docs/entwicklung.md).

## Lizenz

[GPL-3.0-or-later](LICENSE). Die Inhalte folgen dem Skript und den Übungsblättern von Prof. Dr. Volker
Scheidemann; die Formulierungen der Lösungen sind eigene und ohne Gewähr.
