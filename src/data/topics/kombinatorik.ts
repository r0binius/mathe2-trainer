import { topic } from '@/domain/content/build';

const r = String.raw;

/** Chapter 7 of the lecture notes: counting permutations, products and subsets. */
export const kombinatorik = topic({
  id: 'kombinatorik',
  chapter: '7',
  title: 'Elementare Kombinatorik',
  summary:
    'Permutationen, kartesische Produkte, Binomialkoeffizienten und der binomische Lehrsatz.',
  definitions: [
    {
      id: 'permutation',
      title: 'Permutation und symmetrische Gruppe',
      ref: 'Definition 145',
      statement: r`Ist $A$ eine endliche Menge, so heißt eine **bijektive** Abbildung $\sigma : A \to A$ **Permutation** der Menge $A$.

Die Menge $S_n := \{\sigma \mid \sigma \text{ ist Permutation von } \{1,\dots,n\}\}$ heißt **symmetrische Gruppe vom Grad $n$**.`,
      note: r`Eine Permutation ist eine Anordnung (Reihenfolge) aller Elemente. Gruppe ist $S_n$ bezüglich der Hintereinanderausführung $\circ$.`,
    },
    {
      id: 'fakultaet',
      title: 'Fakultät',
      statement: r`Für $n \in \N$ ist $n! := 1 \cdot 2 \cdot \ldots \cdot n$, und man setzt $0! := 1$.

Rekursiv: $n! = n \cdot (n-1)!$.`,
      note: r`$0! = 1$ passt dazu, dass es genau eine Abbildung $\emptyset \to \emptyset$ gibt, und macht $\binom{n}{0} = \frac{n!}{0!\,n!} = 1$ richtig.`,
    },
    {
      id: 'binomialkoeffizient',
      title: 'Binomialkoeffizient',
      ref: 'Kapitel 7, vor Theorem 151',
      statement: r`Für $n, k \in \N_0$ ist der **Binomialkoeffizient** $\binom{n}{k}$ („$n$ über $k$“) die **Anzahl der $k$-elementigen Teilmengen** einer $n$-elementigen Menge:

$$\binom{n}{k} := \bigl|\{A \in \mathcal{P}(\{1,\dots,n\}) \mid \#A = k\}\bigr|$$`,
      note: r`Definiert wird er als **Anzahl**, nicht über die Formel. Die Formel $\frac{n!}{k!(n-k)!}$ ist ein Satz (Theorem 151).`,
    },
  ],
  theorems: [
    {
      id: 'anzahl-permutationen',
      title: 'Anzahl der Permutationen',
      ref: 'Theorem 147',
      statement: r`$$\# S_n = n!$$

Eine $n$-elementige Menge lässt sich auf genau $n!$ Arten anordnen.`,
      note: r`Beweisidee: Für das Bild von $1$ gibt es $n$ Möglichkeiten, für das von $2$ noch $n-1$, … – Induktion nach $n$.`,
    },
    {
      id: 'kartesisches-produkt',
      title: 'Mächtigkeit kartesischer Produkte',
      ref: 'Theorem 150',
      statement: r`Seien $A_1, \dots, A_n$ nichtleere, endliche Mengen. Dann ist

$$|A_1 \times \dots \times A_n| = |A_1| \cdot \ldots \cdot |A_n|.$$`,
      note: r`Das ist die Produktregel des Zählens: unabhängige Wahlen multiplizieren sich. Beispiel: Mit $64$ Bit lassen sich $|\{0,1\}^{64}| = 2^{64}$ Werte darstellen.`,
    },
    {
      id: 'eigenschaften-binomial',
      title: 'Elementare Eigenschaften der Binomialkoeffizienten',
      ref: 'Kapitel 7, Punkte 1–6 und Formel (38)',
      statement: r`Für $n, k \in \N_0$ gilt:

- $\binom{n}{k} = 0$, falls $k > n$
- $\binom{n}{0} = 1 = \binom{n}{n}$ und $\binom{n}{1} = n$
- Symmetrie: $\binom{n}{k} = \binom{n}{n-k}$ für $k = 0, \dots, n$
- Rekursionsformel (Pascalsches Dreieck): $\binom{n}{k} = \binom{n-1}{k-1} + \binom{n-1}{k}$`,
      note: r`Rekursion: Markiere ein Element $a$. Entweder liegt $a$ in der Teilmenge ($\binom{n-1}{k-1}$ Möglichkeiten) oder nicht ($\binom{n-1}{k}$).`,
    },
    {
      id: 'berechnung-binomial',
      title: 'Berechnung der Binomialkoeffizienten',
      ref: 'Theorem 151',
      statement: r`Für $k \le n$ gilt

$$\binom{n}{k} = \frac{n!}{k!\,(n-k)!}.$$`,
      note: r`Beweis per Induktion nach $n$ mit der Rekursionsformel. Lotto: $\binom{49}{6} = 13\,983\,816$.`,
    },
    {
      id: 'binomischer-lehrsatz',
      title: 'Binomischer Lehrsatz',
      ref: 'Theorem 153',
      statement: r`Seien $R$ ein kommutativer Ring, $x, y \in R$ und $n \in \N$. Dann ist

$$(x + y)^n = \sum_{k=0}^{n} \binom{n}{k} x^k y^{n-k}.$$`,
      note: r`Mit $x = y = 1$ folgt $\sum_{k=0}^{n} \binom{n}{k} = 2^n$ – die Anzahl **aller** Teilmengen einer $n$-elementigen Menge.`,
    },
  ],
  claims: [
    {
      id: 'bits',
      statement: r`Mit $64$ Bit lassen sich genau $2^{64}$ verschiedene Werte darstellen.`,
      holds: true,
      reason: r`$|\{0,1\}^{64}| = 2^{64}$ nach dem Satz über die Mächtigkeit kartesischer Produkte.`,
      ref: 'Übung 7.2',
    },
    {
      id: 'lotto-formel',
      statement: r`Die Anzahl der Möglichkeiten, $6$ aus $49$ Zahlen anzukreuzen, ist $\frac{49!}{6!}$.`,
      holds: false,
      reason: r`Es ist $\binom{49}{6} = \frac{49!}{6!\,43!} = 13\,983\,816$. Der Faktor $43!$ im Nenner fehlt.`,
    },
    {
      id: 'symmetrie',
      statement: r`Für alle $0 \le k \le n$ gilt $\binom{n}{k} = \binom{n}{n-k}$.`,
      holds: true,
      reason: r`Jede $k$-elementige Teilmenge $B$ bestimmt eindeutig ihr $(n-k)$-elementiges Komplement $A \setminus B$ und umgekehrt.`,
    },
    {
      id: 'lehrsatz-falsch',
      statement: r`Für alle $x, y \in \R$ und $n \in \N$ gilt $(x+y)^n = x^n + y^n$.`,
      holds: false,
      reason: r`Schon für $n = 2$ fehlt der gemischte Term: $(x+y)^2 = x^2 + 2xy + y^2$. Allgemein gilt $(x+y)^n = \sum_{k=0}^n \binom{n}{k} x^k y^{n-k}$.`,
    },
    {
      id: 'teilmengen',
      statement: r`Eine Menge mit $n$ Elementen hat genau $2^n$ Teilmengen.`,
      holds: true,
      reason: r`$\sum_{k=0}^n \binom{n}{k} = (1+1)^n = 2^n$ nach dem binomischen Lehrsatz.`,
      ref: 'Übung 7.5',
    },
    {
      id: 'permutationen-5',
      statement: r`Es gibt $5^5$ Möglichkeiten, fünf verschiedene Bücher nebeneinander ins Regal zu stellen.`,
      holds: false,
      reason: r`Anordnungen ohne Wiederholung sind Permutationen: $5! = 120$. $5^5$ wäre die Anzahl mit Wiederholung.`,
    },
    {
      id: 'k-groesser-n',
      statement: r`Für $k > n$ ist $\binom{n}{k} = 0$.`,
      holds: true,
      reason: r`Eine Teilmenge kann nicht mehr Elemente haben als ihre Obermenge.`,
    },
    {
      id: 'passwoerter',
      statement: r`Aus den $94$ druckbaren ASCII-Zeichen lassen sich $94 \cdot n$ Passwörter der Länge $n$ bilden.`,
      holds: false,
      reason: r`Für jede der $n$ Stellen gibt es $94$ Möglichkeiten, also $94^n$ Passwörter (Produktregel).`,
      ref: 'Übung 7.3',
    },
  ],
  problems: [
    {
      id: 'dreiergruppen',
      title: 'Dreiergruppen auslosen',
      source: 'Blatt 1, Aufgabe 1',
      points: 8,
      task: r`In einer Vorlesung sitzen $30$ Studierende, mit zweien davon bist du befreundet. Per Los werden Dreiergruppen gebildet.

a) Wie viele verschiedene Dreiergruppen können entstehen?
b) Wie groß ist die Chance, dass du mit **beiden** Freund:innen in einer Gruppe landest?
c) … dass **genau eine:r** der beiden in deiner Gruppe ist?
d) … dass **keine:r** der beiden in deiner Gruppe ist?`,
      hint: r`Für b)–d): Deine Gruppe ist festgelegt durch die Wahl von $2$ Personen aus den übrigen $29$. Zähle günstige durch mögliche Fälle.`,
      solution: r`a) Eine Dreiergruppe ist eine $3$-elementige Teilmenge: $\binom{30}{3} = \frac{30 \cdot 29 \cdot 28}{6} = 4060$.

b) Für deine beiden Mitglieder gibt es $\binom{29}{2} = 406$ Möglichkeiten, genau eine davon besteht aus beiden Freund:innen: $P = \frac{1}{406} \approx 0{,}25\,\%$.

c) Eine:n der $2$ Freund:innen und eine der $27$ anderen Personen wählen: $2 \cdot 27 = 54$, also $P = \frac{54}{406} = \frac{27}{203} \approx 13{,}3\,\%$.

d) Beide aus den $27$ anderen: $\binom{27}{2} = 351$, also $P = \frac{351}{406} \approx 86{,}5\,\%$.

Probe: $1 + 54 + 351 = 406$.`,
    },
    {
      id: 'lotto-drei-richtige',
      title: 'Drei Richtige im Lotto',
      source: 'nach Übung 7.4',
      points: 5,
      task: r`Wie groß ist die Wahrscheinlichkeit, beim Lotto „6 aus 49“ mit einer Tippreihe **genau drei** Richtige zu haben?`,
      hint: r`Wähle $3$ der $6$ gezogenen Zahlen und $3$ der $43$ nicht gezogenen.`,
      solution: r`Günstig: $\binom{6}{3} \cdot \binom{43}{3} = 20 \cdot 12\,341 = 246\,820$ Tippreihen.

Möglich: $\binom{49}{6} = 13\,983\,816$.

$$P = \frac{246\,820}{13\,983\,816} \approx 1{,}77\,\%$$`,
    },
    {
      id: 'passwort-komplement',
      title: 'Passwörter mit mindestens einer Ziffer',
      source: 'nach Übung 7.3',
      points: 4,
      task: r`Ein Passwort der Länge $8$ besteht aus Kleinbuchstaben ($26$) und Ziffern ($10$). Wie viele Passwörter enthalten **mindestens eine Ziffer**?`,
      hint: r`Zähle das Gegenteil: Passwörter ganz ohne Ziffer.`,
      solution: r`Alle Passwörter: $36^8$. Ohne jede Ziffer: $26^8$.

Mindestens eine Ziffer: $36^8 - 26^8 = 2\,821\,109\,907\,456 - 208\,827\,064\,576 = 2\,612\,282\,842\,880$.`,
    },
    {
      id: 'koeffizient',
      title: 'Koeffizient mit dem binomischen Lehrsatz',
      points: 4,
      task: r`Bestimme den Koeffizienten von $x^3$ in $(2x - 1)^5$.`,
      solution: r`Nach dem binomischen Lehrsatz ist $(2x - 1)^5 = \sum_{k=0}^{5} \binom{5}{k} (2x)^k (-1)^{5-k}$.

Für $k = 3$: $\binom{5}{3} \cdot 2^3 \cdot (-1)^2 = 10 \cdot 8 \cdot 1 = 80$.`,
    },
    {
      id: 'summe-binomial',
      title: 'Summe einer Zeile im Pascalschen Dreieck',
      source: 'Übung 7.5',
      points: 4,
      task: r`Was zählt die Summe $s(n) := \sum_{k=0}^{n} \binom{n}{k}$, und welchen Wert hat sie? Begründe.`,
      solution: r`$\binom{n}{k}$ zählt die $k$-elementigen Teilmengen von $\{1,\dots,n\}$. Die Summe über alle $k$ zählt also **alle** Teilmengen, d. h. $s(n) = |\mathcal{P}(\{1,\dots,n\})|$.

Mit dem binomischen Lehrsatz für $x = y = 1$: $s(n) = (1+1)^n = 2^n$. Das braucht nur $n - 1$ Multiplikationen und keine Addition.`,
    },
  ],
});
