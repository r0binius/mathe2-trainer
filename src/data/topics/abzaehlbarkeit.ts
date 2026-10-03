import { topic } from '@/domain/content/build';

const r = String.raw;

/** Chapter 8 of the lecture notes: which infinite sets can be numbered. */
export const abzaehlbarkeit = topic({
  id: 'abzaehlbarkeit',
  chapter: '8',
  title: 'Abzählbarkeit',
  summary: 'Gleichmächtigkeit, abzählbare und überabzählbare Mengen, Satz von Cantor.',
  definitions: [
    {
      id: 'gleichmaechtig',
      title: 'Gleichmächtige Mengen',
      ref: 'Definition 154 a)',
      statement: r`Zwei Mengen $A, B$ heißen **gleichmächtig**, wenn es eine **bijektive** Abbildung $f : A \to B$ gibt.`,
    },
    {
      id: 'abzaehlbar',
      title: 'Abzählbar, höchstens abzählbar, überabzählbar',
      ref: 'Definition 154 b)–d)',
      statement: r`Eine Menge $A$ heißt

- **abzählbar** (abzählbar unendlich), wenn $A$ gleichmächtig zu $\N$ ist,
- **höchstens abzählbar**, wenn $A$ endlich oder abzählbar ist,
- **überabzählbar**, wenn $A$ weder endlich noch abzählbar ist.`,
      note: r`Abzählbar heißt: Man kann den Elementen eine „Hausnummer“ geben, $A = \{a_1, a_2, a_3, \dots\}$. Achtung: Im Skript bedeutet „abzählbar“ immer **unendlich**.`,
    },
  ],
  theorems: [
    {
      id: 'cantor',
      title: 'Satz von Cantor',
      ref: 'Theorem 156',
      statement: r`Seien $A$ eine Menge und $f : A \to \mathcal{P}(A)$ eine Abbildung. Dann ist $f$ **nicht surjektiv**.`,
      note: r`Beweisidee (Diagonalargument): Die Menge $M := \{a \in A \mid a \notin f(a)\}$ wird von $f$ nicht getroffen. Wäre $M = f(m)$, so folgte $m \in M \Leftrightarrow m \notin M$. Folge: $\mathcal{P}(\N)$ ist überabzählbar.`,
    },
    {
      id: 'teilmenge',
      title: 'Teilmengen abzählbarer Mengen',
      ref: 'Theorem 158',
      statement: r`Jede Teilmenge einer abzählbaren Menge ist **höchstens abzählbar**.`,
    },
    {
      id: 'kriterium',
      title: 'Kriterium für Abzählbarkeit',
      ref: 'Korollar 159',
      statement: r`Ist $X$ eine **unendliche** Menge und gibt es

- eine **injektive** Abbildung $f : X \to \N$ oder
- eine **surjektive** Abbildung $g : \N \to X$,

so ist $X$ abzählbar.`,
      note: r`Das ist das Werkzeug in Aufgaben: Man muss keine Bijektion angeben, eine Injektion nach $\N$ (oder Surjektion von $\N$) genügt.`,
    },
    {
      id: 'beispiele',
      title: 'Wichtige abzählbare Mengen',
      ref: 'Beispiele 160–162, Übung 8.2',
      statement: r`Abzählbar sind:

- $\Z$ und $\N^n$ für jedes $n \in \N$ (z. B. über die injektive Abbildung $(p, q) \mapsto 2^p 3^q$),
- $A \times B$ und $A \cup B$ für abzählbare Mengen $A, B$,
- $\Q$ (denn $\Z \times \N \to \Q$, $(z, n) \mapsto \frac{z}{n}$ ist surjektiv),
- die Menge aller Programme einer Programmiersprache (endliche Zeichenketten über einem endlichen Alphabet).`,
    },
    {
      id: 'ueberabzaehlbar',
      title: 'Wichtige überabzählbare Mengen',
      ref: 'Folgerung aus Theorem 156',
      statement: r`Überabzählbar sind die Potenzmenge $\mathcal{P}(\N)$ und die Menge $\R$ der reellen Zahlen.`,
      note: r`Folge für die Informatik: Es gibt überabzählbar viele Programmeigenschaften ($\mathcal{P}(\mathcal{P}rog)$), aber nur abzählbar viele Programme – nicht alles ist berechenbar.`,
    },
  ],
  claims: [
    {
      id: 'q-abzaehlbar',
      statement: r`$\Q$ ist abzählbar.`,
      holds: true,
      reason: r`$\Z \times \N$ ist abzählbar und $(z, n) \mapsto \frac{z}{n}$ ist surjektiv auf $\Q$.`,
      ref: 'Beispiel 161',
    },
    {
      id: 'r-abzaehlbar',
      statement: r`$\R$ ist abzählbar, weil $\Q$ dicht in $\R$ liegt.`,
      holds: false,
      reason: r`$\R$ ist überabzählbar. Dichtheit sagt nichts über die Mächtigkeit aus.`,
    },
    {
      id: 'n-z',
      statement: r`$\N$ und $\Z$ sind gleichmächtig, obwohl $\N \subsetneq \Z$ gilt.`,
      holds: true,
      reason: r`Z. B. ist $f : \N \to \Z$ mit $f(2k) = k$, $f(2k-1) = -(k-1)$ bijektiv. Bei unendlichen Mengen kann eine echte Teilmenge gleichmächtig sein.`,
    },
    {
      id: 'potenzmenge',
      statement: r`Es gibt eine surjektive Abbildung $\N \to \mathcal{P}(\N)$.`,
      holds: false,
      reason: r`Nach dem Satz von Cantor ist keine Abbildung $A \to \mathcal{P}(A)$ surjektiv.`,
      ref: 'Theorem 156',
    },
    {
      id: 'unendliche-teilmenge',
      statement: r`Jede unendliche Teilmenge von $\N$ ist abzählbar.`,
      holds: true,
      reason: r`Teilmengen abzählbarer Mengen sind höchstens abzählbar, also endlich oder abzählbar – und endlich ist sie nicht.`,
      ref: 'Theorem 158',
    },
    {
      id: 'programme',
      statement: r`Die Menge aller Computerprogramme ist überabzählbar, weil Programme beliebig lang sein können.`,
      holds: false,
      reason: r`Jedes Programm ist eine **endliche** Zeichenkette über einem endlichen Alphabet; davon gibt es nur abzählbar viele.`,
      ref: 'Beispiel 162',
    },
    {
      id: 'injektion',
      statement: r`Gibt es eine injektive Abbildung $X \to \N$ und ist $X$ unendlich, so ist $X$ abzählbar.`,
      holds: true,
      reason: r`Das ist Korollar 159 i).`,
    },
    {
      id: 'endlich-abzaehlbar',
      statement: r`Im Sinne des Skripts ist die Menge $\{1, 2, 3\}$ abzählbar.`,
      holds: false,
      reason: r`„Abzählbar“ heißt gleichmächtig zu $\N$, also unendlich. $\{1,2,3\}$ ist **höchstens abzählbar**.`,
      ref: 'Definition 154',
    },
  ],
  problems: [
    {
      id: 'z-abzaehlbar',
      title: 'Die ganzen Zahlen sind abzählbar',
      points: 4,
      task: r`Zeige, dass $\Z$ abzählbar ist.`,
      hint: r`Zähle abwechselnd: $0, 1, -1, 2, -2, \dots$ – oder nutze Korollar 159.`,
      solution: r`Definiere $g : \N \to \Z$ durch $g(2k) := k$ und $g(2k - 1) := -(k-1)$ für $k \in \N$, also $g(1) = 0,\ g(2) = 1,\ g(3) = -1,\ g(4) = 2, \dots$

$g$ ist surjektiv: Jedes $z > 0$ ist $g(2z)$, jedes $z \le 0$ ist $g(2(1-z) - 1)$. Da $\Z$ unendlich ist, folgt mit Korollar 159 ii), dass $\Z$ abzählbar ist. ($g$ ist sogar bijektiv.)`,
    },
    {
      id: 'cantor-beweis',
      title: 'Beweis des Satzes von Cantor',
      source: 'Theorem 156',
      points: 6,
      task: r`Sei $f : A \to \mathcal{P}(A)$ eine beliebige Abbildung. Beweise, dass $f$ nicht surjektiv ist.`,
      hint: r`Betrachte $M := \{a \in A \mid a \notin f(a)\}$.`,
      solution: r`Setze $M := \{a \in A \mid a \notin f(a)\} \in \mathcal{P}(A)$. Angenommen, $f$ wäre surjektiv. Dann gäbe es ein $m \in A$ mit $f(m) = M$.

- Ist $m \in M$, so gilt nach Definition von $M$: $m \notin f(m) = M$. Widerspruch.
- Ist $m \notin M = f(m)$, so erfüllt $m$ die Bedingung von $M$, also $m \in M$. Widerspruch.

Beide Fälle sind unmöglich, also liegt $M$ nicht im Bild von $f$.`,
    },
    {
      id: 'decide',
      title: 'Nicht programmierbare Funktion',
      source: 'Blatt 1, Aufgabe 2',
      points: 8,
      task: r`Sei $\mathcal{P}rog$ die Menge aller Programme und $\mathcal{E}$ die Menge aller Programmeigenschaften, wobei eine Eigenschaft eine Teilmenge $E \subset \mathcal{P}rog$ ist.

a) Begründe, dass $\mathcal{E} = \mathcal{P}(\mathcal{P}rog)$ ist.
b) Zeige: Es gibt kein Programm $\mathrm{Decide}$, das für **jedes** Programm $P$ und **jede** Eigenschaft $E$ entscheidet, ob $P \in E$ gilt.`,
      hint: r`Ordne jedem Programm die Eigenschaft zu, die es „erkennt“, und wende den Satz von Cantor an.`,
      solution: r`a) Jede Teilmenge von $\mathcal{P}rog$ ist nach Definition eine Eigenschaft und umgekehrt, also $\mathcal{E} = \mathcal{P}(\mathcal{P}rog)$.

b) Ordne jedem Programm $Q$ die Eigenschaft zu, die es erkennt: $f(Q) := \{P \in \mathcal{P}rog \mid Q \text{ gibt bei Eingabe } P \text{ den Wert } 1 \text{ aus}\}$. Das ist eine Abbildung $f : \mathcal{P}rog \to \mathcal{P}(\mathcal{P}rog) = \mathcal{E}$.

Nach dem Satz von Cantor ist $f$ nicht surjektiv: Es gibt eine Eigenschaft $E^*$, die von **keinem** Programm erkannt wird.

Gäbe es $\mathrm{Decide}$, so wäre $Q^* : P \mapsto \mathrm{Decide}(P, E^*)$ ein Programm mit $f(Q^*) = E^*$. Widerspruch – $f_{\mathrm{Decide}}$ lässt sich nicht programmieren.`,
    },
    {
      id: 'n-kreuz-n',
      title: 'Injektion von N×N nach N',
      source: 'Beispiel 160',
      points: 5,
      task: r`Zeige, dass $f : \N \times \N \to \N$, $(p, q) \mapsto 2^p \cdot 3^q$ injektiv ist, und folgere, dass $\N \times \N$ abzählbar ist.`,
      solution: r`Sei $2^{p_1} 3^{q_1} = 2^{p_2} 3^{q_2}$, o. B. d. A. $p_1 \ge p_2$. Division liefert $2^{p_1 - p_2} = 3^{q_2 - q_1}$.

Links steht eine natürliche Zahl, also auch rechts, d. h. $q_2 \ge q_1$. Wäre $p_1 > p_2$, stünde links eine gerade Zahl und rechts eine ungerade – Widerspruch. Also $p_1 = p_2$, damit $3^{q_2 - q_1} = 1$ und $q_1 = q_2$.

$f$ ist also injektiv, $\N \times \N$ ist unendlich, und nach Korollar 159 i) abzählbar.`,
    },
  ],
});
