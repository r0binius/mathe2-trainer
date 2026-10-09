# Entwicklung und Betrieb

Alles, was man über Mathe 2 (`mathe2-trainer`) wissen sollte, bevor man etwas ändert. Wie ein Beitrag
eingereicht wird, steht in [CONTRIBUTING.md](../CONTRIBUTING.md); die Inhalte und der Aufbau des Codes
stehen in der [README](../README.md).

## Die Trainer

Es gibt vier Schwesterprojekte aus demselben Ursprung. Sie teilen sich Oberfläche, Lernablauf und
Plattformcode, nur die Inhalte (`src/data/`) und ein paar Texte unterscheiden sich.

| Fach                            | Repository                                                     | Seite                                          |
| ------------------------------- | -------------------------------------------------------------- | ---------------------------------------------- |
| Algorithmen & Datenstrukturen   | [`ad-trainer`](https://github.com/r0binius/ad-trainer)         | [ad.gobin.studio](https://ad.gobin.studio)     |
| Mathe 2                         | [`mathe2-trainer`](https://github.com/r0binius/mathe2-trainer) | [math.gobin.studio](https://math.gobin.studio) |
| Fortgeschrittene Programmierung | [`prog2-trainer`](https://github.com/r0binius/prog2-trainer)   | [prog.gobin.studio](https://prog.gobin.studio) |
| Theoretische Informatik         | [`theo-trainer`](https://github.com/r0binius/theo-trainer)     | [theo.gobin.studio](https://theo.gobin.studio) |

Jede Seite ist auch unter `https://mathe2-trainer.robinada.workers.dev` erreichbar.

**Gemeinsamer Code:** Ein Fehler in der Oberfläche, im Lernablauf oder im Speichern steckt meist in
allen vier. Bitte öffne dann einen Pull Request pro Repository oder nenne die anderen im Pull
Request, damit der Maintainer sie nachzieht. Fehler in den Inhalten betreffen nur ein Repository.

## Lokal arbeiten

Voraussetzungen: Node 24 oder neuer und pnpm.

| Befehl              | Zweck                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `pnpm install`      | Abhängigkeiten und Git-Hooks installieren                             |
| `pnpm dev`          | Entwicklungsserver                                                    |
| `pnpm test`         | Tests, darunter: jede Formel ist lesbar, jede ID kommt nur einmal vor |
| `pnpm typecheck`    | Typprüfung                                                            |
| `pnpm lint`         | ESLint (`pnpm lint:fix` behebt, was sich beheben lässt)               |
| `pnpm format:check` | Prettier prüft (`pnpm format` formatiert)                             |
| `pnpm build`        | baut `dist/index.html`, eine einzelne Datei                           |

Den Server mit dem Sync probierst du lokal so aus, ohne echte Daten zu berühren (der Speicher ist dabei
nur lokal):

```sh
pnpm build
pnpm wrangler dev
```

Der Hinweis „Dein Fortschritt liegt nur in diesem Browser“ erscheint nur über `https`, also nicht
lokal. Den Sync-Schlüssel kannst du trotzdem in den Einstellungen erzeugen und speichern.

## Git

- Nie direkt auf `main` committen; ein Hook verhindert das. Branch-Namen nach
  [Conventional Branch](https://conventionalbranch.org): `<typ>/<kurz-und-klein>`, mit `feat/`,
  `fix/`, `chore/` und so weiter (`feat/neue-aufgabe`, `fix/hanoi-loesung`).
- Commit-Nachrichten nach [Conventional Commits](https://www.conventionalcommits.org/de):
  `typ(bereich): was sich ändert`, klein, im Imperativ, ohne Punkt (`fix(data): richtige Reihenfolge der
Hanoi-Züge`). Bereiche stehen im `git log`. Ein Hook prüft das.
- Ein Pull Request ändert eine Sache. Übernommen wird per Rebase, damit die Historie linear bleibt.

## Veröffentlichung

- Jeder Push auf `main` startet die GitHub Action `deploy.yml`: Typprüfung, Lint, Format, Tests,
  Build, dann `wrangler deploy`. Nach etwa einer Minute ist die Seite live. Schlägt ein Schritt
  fehl, wird nichts veröffentlicht; den Grund zeigt der Reiter _Actions_.
- Pull Requests prüft `ci.yml` mit denselben Schritten, aber ohne Zugriff auf Secrets und ohne
  Veröffentlichung. Workflows von Forks gibt der Maintainer vor dem ersten Lauf frei.
- Nur der Maintainer ([@r0binius](https://github.com/r0binius)) ändert `main`, übernimmt Pull Requests
  und verwaltet die Cloudflare-Zugangsdaten (die Repository-Secrets `CLOUDFLARE_API_TOKEN` und
  `CLOUDFLARE_ACCOUNT_ID`). Der Token läuft irgendwann ab; dann bricht der Deploy ab, bis er in den
  Secrets erneuert ist.

## Fortschritt und Sync – bitte nicht kaputtmachen

Der Fortschritt der Lernenden liegt im Browser (`localStorage`, Schlüssel `mathe2-trainer/progress`) und,
wer will, zusätzlich auf dem Server: Der Worker (`worker/index.ts`) speichert ihn in einem
Cloudflare-KV-Speicher unter `/api/progress`. Den Sync-Schlüssel erzeugen die Lernenden selbst in
den Einstellungen; der Speicherplatz heißt wie sein Hash. Wer den Schlüssel kennt, kann lesen und
schreiben, er ist also geheim zu halten. Der Worker lehnt Schlüssel unter 32 Zeichen ab.

Damit der Fortschritt nie verloren geht, gelten diese Regeln:

1. **IDs von Karten, Aufgaben und Kapiteln nie ändern oder wiederverwenden.** Der Fortschritt hängt
   an ihnen.
2. **Die KV-ID in `wrangler.jsonc` nie ändern oder entfernen.** Sie bindet den Worker an den
   bestehenden Speicher. Fehlt sie, legt ein Deploy einen neuen, leeren an, und alle Server-Kopien
   scheinen weg.
3. **Das Format des Fortschritts (`src/domain/progress/`) nur abwärtskompatibel ändern.** Was sich
   nicht mehr lesen lässt, gilt als leer und würde beim nächsten Speichern überschrieben.
4. **Nicht öfter zum Server schreiben.** Der kostenlose Plan erlaubt etwa 1000 Schreibvorgänge pro
   Tag für alle vier Trainer zusammen. Darum sendet `src/platform/deferred.ts` nur den neuesten
   Stand, höchstens alle fünf Minuten und wenn die Seite verborgen wird; im Browser wird weiter bei
   jeder Antwort gespeichert. Ein Speichern pro Antwort würde das Limit schnell sprengen.

## Prüfungstermin

Der Zähler „Bis zur Prüfung“ auf der Startseite liest `src/data/exam.ts`. Dort stehen die möglichen
Prüfungstage; mehr als einen, wenn die Einteilung den Tag bestimmt. Nach dem letzten Tag
verschwindet die Anzeige von selbst.

## Aussehen

- Farben, Abstände und Schriften stehen als Tokens in `src/styles/tokens.css`; Komponenten nutzen die
  Rollen, nie Rohfarben, damit helles und dunkles Aussehen zusammenpassen.
- Das Favicon ist für alle Trainer dasselbe Motiv, eine Taste in der Akzentfarbe `#a94f29` mit
  dunklerer Kante `#7d3a1c` und den Kürzeln der Fächer (AD, M2, P2, TI). Es steht inline
  in `index.html`, damit das Build eine einzige Datei bleibt; für iOS liegt
  `public/apple-touch-icon.png` (180 × 180) daneben. Das eigene Kürzel dieses Trainers ist `M2`.
