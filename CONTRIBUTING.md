# Mitarbeiten

Du hast einen Fehler im Material gefunden oder möchtest etwas ergänzen? Gern. Dieses Repository
(Mathe 2 – Prüfungstrainer) gehört zu einer Reihe von Trainern; Änderungen laufen über Pull Requests, und
[@r0binius](https://github.com/r0binius) prüft und übernimmt sie. Nach der Übernahme wird die Seite
automatisch neu veröffentlicht.

## Ein Fehler, ohne selbst zu korrigieren

Eröffne ein [Issue](../../issues/new): Welche Karte oder Aufgabe, was stimmt nicht, und – wenn
möglich – was richtig wäre (Foliensatz und Seite helfen).

## Selbst korrigieren

1. Das Repository **forken** (oben rechts) und den Fork klonen.
2. `pnpm install` (Node 24 oder neuer; die Git-Hooks werden dabei eingerichtet).
3. Einen Branch anlegen, zum Beispiel `fix/hanoi-loesung` oder `feat/neue-aufgabe`. Direkt auf
   `main` lässt sich nicht committen.
4. Ändern. Die Inhalte stehen in `src/data/topics/`, ihr Format steht in der
   [README](README.md#inhalte-ergänzen). **Die `id` einer Karte nie ändern:** der Fortschritt aller
   Lernenden hängt daran.
5. Committen mit einer [Conventional-Commits](https://www.conventionalcommits.org/de)-Nachricht,
   zum Beispiel `fix(data): richtige Reihenfolge der Hanoi-Züge`. Ein Hook prüft das.
6. Vor dem Push `pnpm test`, `pnpm lint` und `pnpm format:check` laufen lassen (`pnpm format` räumt
   die Formatierung auf). Dieselben Prüfungen laufen auf GitHub für jeden Pull Request.
7. Einen **Pull Request** gegen `main` öffnen und kurz beschreiben, was sich ändert und woher du es
   weißt (Folie, Skript, Aufgabe).

Ein Pull Request sollte eine Sache ändern; so lässt er sich schnell prüfen. `main` ändert nur der
Maintainer.

Mehr zum Betrieb, zum Sync und zu den Regeln, die den Fortschritt der Lernenden schützen, steht in
[docs/entwicklung.md](docs/entwicklung.md).
