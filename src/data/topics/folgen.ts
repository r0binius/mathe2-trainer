import { topic } from '@/domain/content/build';

const r = String.raw;

/** Chapter 9.3 of the lecture notes: sequences and their convergence. */
export const folgen = topic({
  id: 'folgen',
  chapter: '9.3',
  title: 'Folgen',
  summary: 'Konvergenz, Cauchy-Folgen, Monotonie, Teilfolgen und der Satz von Bolzano-Weierstraß.',
  definitions: [
    {
      id: 'folge',
      title: 'Folge',
      ref: 'Definition 187',
      statement: r`Sei $X \ne \emptyset$ eine Menge. Eine **Folge** in $X$ ist eine Abbildung $f : \N \to X$, d. h. ein Element von $\operatorname{Abb}(\N, X)$.

Schreibweise: $(a_n)_{n \in \N}$ mit $a_n := f(n)$.`,
    },
    {
      id: 'konvergenz',
      title: 'Konvergente Folge, Grenzwert',
      ref: 'Definition 189 b)',
      statement: r`Seien $(X, d)$ ein metrischer Raum, $(a_n)$ eine Folge in $X$ und $a \in X$. $(a_n)$ heißt **konvergent mit Grenzwert $a$**, in Zeichen $\lim_{n \to \infty} a_n = a$, wenn gilt:

Zu jedem $\varepsilon > 0$ existiert ein Index $N = N_\varepsilon \in \N$, sodass für alle $n \ge N$ gilt

$$d(a_n, a) \le \varepsilon.$$`,
      note: r`Kurz: $\forall \varepsilon > 0\ \exists N\ \forall n \ge N: d(a_n, a) \le \varepsilon$. In $\R$ und $\C$ ist $d(a_n, a) = |a_n - a|$. Äquivalent: $(d(a_n, a))_n$ ist eine reelle Nullfolge.`,
    },
    {
      id: 'beschraenkt-nullfolge-divergent',
      title: 'Beschränkte Folge, Nullfolge, divergente Folge',
      ref: 'Definition 189 a), c), d)',
      statement: r`- $(a_n)$ heißt **beschränkt**, wenn die Wertemenge $\{a_n \mid n \in \N\}$ beschränkt ist.
- Eine konvergente Folge mit Grenzwert $0$ heißt **Nullfolge**.
- Eine Folge, die nicht konvergiert, heißt **divergent**.`,
    },
    {
      id: 'cauchy-folge',
      title: 'Cauchy-Folge',
      ref: 'Definition 193',
      statement: r`Seien $(X, d)$ ein metrischer Raum und $(a_n)$ eine Folge in $X$. $(a_n)$ heißt **Cauchy-Folge**, wenn es zu jedem $\varepsilon > 0$ ein $N_\varepsilon \in \N$ gibt, sodass für alle $m, n \ge N_\varepsilon$ gilt

$$d(a_m, a_n) \le \varepsilon.$$`,
      note: r`Der Grenzwert kommt in der Definition nicht vor: Die Folgenglieder rücken **untereinander** beliebig nah zusammen.`,
    },
    {
      id: 'monoton',
      title: 'Monotone Folge',
      ref: 'Definition 199',
      statement: r`Eine Folge $(a_n)$ in $\R$ heißt

- **monoton wachsend**, wenn $a_n \le a_{n+1}$ für alle $n \in \N$,
- **monoton fallend**, wenn $a_n \ge a_{n+1}$ für alle $n \in \N$.

Gilt stets $<$ bzw. $>$, heißt sie **streng** monoton wachsend bzw. fallend.`,
    },
    {
      id: 'teilfolge',
      title: 'Teilfolge',
      ref: 'Definition 202',
      statement: r`Seien $(a_n)_{n \in \N}$ eine Folge und $\varphi : \N \to \N$ **streng monoton wachsend**, d. h. $\varphi(n) < \varphi(n+1)$ für alle $n$. Dann heißt die Folge

$$\left(a_{\varphi(n)}\right)_{n \in \N}$$

eine **Teilfolge** von $(a_n)$.`,
    },
  ],
  theorems: [
    {
      id: 'eindeutigkeit',
      title: 'Eindeutigkeit des Grenzwerts',
      ref: 'Theorem 192',
      statement: r`Der Grenzwert einer konvergenten Folge $(a_n)$ in einem metrischen Raum $(X, d)$ ist **eindeutig bestimmt**.`,
      note: r`Beweisidee: Sind $a, b$ Grenzwerte, so ist $d(a, b) \le d(a, a_n) + d(a_n, b) \le 2\varepsilon$ für jedes $\varepsilon > 0$, also $d(a,b) = 0$.`,
    },
    {
      id: 'konvergent-beschraenkt',
      title: 'Konvergente Folgen sind beschränkt',
      ref: 'Theorem 194',
      statement: r`Ist $(a_n)$ eine konvergente Folge im metrischen Raum $(X, d)$, so ist $(a_n)$ beschränkt.`,
      note: r`Die Umkehrung ist falsch: $a_n = (-1)^n$ ist beschränkt und divergent.`,
    },
    {
      id: 'konvergent-cauchy',
      title: 'Konvergente Folgen sind Cauchy-Folgen',
      ref: 'Übung 9.9',
      statement: r`Jede konvergente Folge in einem metrischen Raum $(X, d)$ ist eine Cauchy-Folge.`,
      note: r`Beweis: $d(a_m, a_n) \le d(a_m, a) + d(a, a_n) \le \frac{\varepsilon}{2} + \frac{\varepsilon}{2}$ für $m, n \ge N_{\varepsilon/2}$.`,
    },
    {
      id: 'grenzwertsaetze',
      title: 'Grenzwertsätze (Rechenregeln)',
      ref: 'Theorem 196, Übung 9.13',
      statement: r`Seien $(a_n)$, $(b_n)$ konvergente Folgen in $\C$ mit Grenzwerten $a$ und $b$ und sei $\lambda \in \C$. Dann konvergieren auch die folgenden Folgen, und es gilt:

- $\lim_{n\to\infty} (a_n + b_n) = a + b$
- $\lim_{n\to\infty} (\lambda a_n) = \lambda a$
- $\lim_{n\to\infty} (a_n b_n) = ab$
- $\lim_{n\to\infty} \frac{a_n}{b_n} = \frac{a}{b}$, falls $b \ne 0$`,
      note: r`Theorem 196 sagt genauer: Die konvergenten Folgen bilden einen Unterraum $c(\C)$ von $\operatorname{Abb}(\N, \C)$, und $L : (a_n) \mapsto \lim a_n$ ist linear.`,
    },
    {
      id: 'standardgrenzwerte',
      title: 'Wichtige Grenzwerte',
      ref: 'Beispiele 191, 195, 197',
      statement: r`- $\lim_{n\to\infty} \frac{1}{n^k} = 0$ für jedes $k \in \N$
- $\lim_{n\to\infty} q^n = 0$ für $|q| < 1$
- $\lim_{n\to\infty} \sqrt[n]{\alpha} = 1$ für $\alpha > 0$
- $\lim_{n\to\infty} \frac{p(n)}{n^N} = 1$ für ein Polynom $p(x) = x^N + c_{N-1}x^{N-1} + \dots + c_0$
- $\left((-1)^n\right)$ ist beschränkt und **divergent**`,
    },
    {
      id: 'monotoniekriterium',
      title: 'Monotoniekriterium',
      ref: 'Theorem 200',
      statement: r`Sei $(a_n)_{n\in\N}$ eine reelle Folge.

- Ist $(a_n)$ monoton wachsend und **nach oben beschränkt**, so ist $(a_n)$ konvergent mit $\lim_{n\to\infty} a_n = \sup_{n \in \N} \{a_n\}$.
- Ist $(a_n)$ monoton fallend und **nach unten beschränkt**, so ist $(a_n)$ konvergent mit $\lim_{n\to\infty} a_n = \inf_{n \in \N} \{a_n\}$.`,
    },
    {
      id: 'cauchy-teilfolge',
      title: 'Cauchy-Folge mit konvergenter Teilfolge',
      ref: 'Theorem 204',
      statement: r`Sei $(a_n)$ eine Cauchy-Folge im metrischen Raum $(X, d)$ und $(a_{\varphi(n)})$ eine Teilfolge, die gegen ein $a \in X$ konvergiert. Dann konvergiert bereits $(a_n)$ selbst gegen $a$.`,
    },
    {
      id: 'monotone-teilfolge',
      title: 'Existenz monotoner Teilfolgen',
      ref: 'Theorem 205',
      statement: r`Jede reelle Folge $(a_n)$ enthält eine **monotone Teilfolge**.`,
    },
    {
      id: 'bolzano-weierstrass',
      title: 'Satz von Bolzano-Weierstraß',
      ref: 'Korollar 206',
      statement: r`Jede **beschränkte** Folge in $\R$ enthält eine **konvergente Teilfolge**.`,
      note: r`Folgt aus: jede Folge hat eine monotone Teilfolge (Theorem 205) + Monotoniekriterium (Theorem 200).`,
    },
    {
      id: 'cauchy-kriterium',
      title: 'Cauchy-Kriterium für Konvergenz',
      ref: 'Korollar 207',
      statement: r`Eine reelle Folge $(a_n)$ konvergiert genau dann gegen ein $a \in \R$, wenn $(a_n)$ eine Cauchy-Folge ist.`,
      note: r`Das ist die Vollständigkeit von $\R$. In $\Q$ gilt es nicht: Es gibt rationale Cauchy-Folgen mit irrationalem Grenzwert.`,
    },
    {
      id: 'komplexe-konvergenz',
      title: 'Konvergenz in ℂ über Real- und Imaginärteil',
      ref: 'Blatt 1, Aufgabe 4',
      statement: r`Eine Folge $(z_n)$ in $\C$ konvergiert genau dann gegen $z \in \C$, wenn $(\operatorname{Re} z_n)$ gegen $\operatorname{Re} z$ und $(\operatorname{Im} z_n)$ gegen $\operatorname{Im} z$ konvergiert.

Insbesondere: $z_n \to z \Rightarrow \overline{z_n} \to \overline{z}$.`,
    },
  ],
  claims: [
    {
      id: 'beschraenkt-konvergent',
      statement: r`Jede beschränkte reelle Folge ist konvergent.`,
      holds: false,
      reason: r`Gegenbeispiel: $a_n = (-1)^n$. Beschränkte Folgen haben nur eine konvergente **Teilfolge** (Bolzano-Weierstraß).`,
    },
    {
      id: 'konvergent-beschraenkt',
      statement: r`Jede konvergente Folge ist beschränkt.`,
      holds: true,
      reason: r`Theorem 194.`,
    },
    {
      id: 'unbeschraenkt-divergent',
      statement: r`Eine unbeschränkte Folge kann nicht konvergieren.`,
      holds: true,
      reason: r`Kontraposition von Theorem 194: konvergent $\Rightarrow$ beschränkt.`,
    },
    {
      id: 'monoton-konvergent',
      statement: r`Jede monoton wachsende reelle Folge ist konvergent.`,
      holds: false,
      reason: r`$a_n = n$ wächst monoton, ist aber unbeschränkt. Es fehlt die Beschränktheit nach oben.`,
    },
    {
      id: 'cauchy-r',
      statement: r`In $\R$ ist jede Cauchy-Folge konvergent.`,
      holds: true,
      reason: r`Cauchy-Kriterium (Korollar 207), die Vollständigkeit von $\R$.`,
    },
    {
      id: 'cauchy-q',
      statement: r`Jede Cauchy-Folge rationaler Zahlen hat einen rationalen Grenzwert.`,
      holds: false,
      reason: r`Z. B. konvergieren die Dezimalbruch-Näherungen $1;\ 1{,}4;\ 1{,}41;\ \dots$ gegen $\sqrt{2} \notin \Q$.`,
    },
    {
      id: 'teilfolge-grenzwert',
      statement: r`Jede Teilfolge einer konvergenten Folge konvergiert gegen denselben Grenzwert.`,
      holds: true,
      reason: r`Wegen $\varphi(n) \ge n$ gilt $d(a_{\varphi(n)}, a) \le \varepsilon$ für alle $n \ge N_\varepsilon$.`,
    },
    {
      id: 'zwei-teilfolgen',
      statement: r`Hat eine Folge zwei Teilfolgen mit verschiedenen Grenzwerten, so ist sie divergent.`,
      holds: true,
      reason: r`Wäre sie konvergent, hätten alle Teilfolgen denselben Grenzwert. Beispiel: $(-1)^n$.`,
    },
    {
      id: 'summe-divergent',
      statement: r`Sind $(a_n)$ und $(b_n)$ divergent, so ist auch $(a_n + b_n)$ divergent.`,
      holds: false,
      reason: r`$a_n = (-1)^n$, $b_n = (-1)^{n+1}$: Die Summe ist konstant $0$.`,
    },
    {
      id: 'epsilon-reihenfolge',
      statement: r`Die Konvergenz $a_n \to a$ ist **gleichbedeutend** mit: Es gibt ein $N \in \N$, sodass für alle $\varepsilon > 0$ und alle $n \ge N$ gilt $|a_n - a| \le \varepsilon$.`,
      holds: false,
      reason: r`Die Quantoren sind vertauscht: Hier dürfte $N$ nicht von $\varepsilon$ abhängen. Das erfüllen nur Folgen, die ab $N$ konstant gleich $a$ sind. $a_n = \frac1n$ konvergiert, erfüllt es aber nicht.`,
    },
    {
      id: 'nullfolge-produkt',
      statement: r`Das Produkt einer Nullfolge mit einer beschränkten Folge ist eine Nullfolge.`,
      holds: true,
      reason: r`Ist $|b_n| \le M$ und $|a_n| \le \frac{\varepsilon}{M}$ für $n \ge N$, so ist $|a_n b_n| \le \varepsilon$.`,
    },
  ],
  problems: [
    {
      id: 'epsilon-beweis',
      title: 'Konvergenz mit der Definition nachweisen',
      source: 'Beispiel 191 b)',
      points: 5,
      task: r`Zeige direkt mit der Definition der Konvergenz, dass $a_n := \frac{1}{n^2}$ eine Nullfolge ist.`,
      solution: r`Sei $\varepsilon > 0$ beliebig. Für alle $n \in \N$ gilt $\left|\frac{1}{n^2} - 0\right| = \frac{1}{n^2} \le \frac{1}{n}$.

Nach dem Archimedischen Axiom gibt es ein $N_\varepsilon \in \N$ mit $N_\varepsilon > \frac{1}{\varepsilon}$. Für alle $n \ge N_\varepsilon$ ist dann

$$\left|\frac{1}{n^2} - 0\right| \le \frac{1}{n} \le \frac{1}{N_\varepsilon} < \varepsilon.$$`,
    },
    {
      id: 'wurzel-differenz',
      title: 'Differenz zweier Wurzeln',
      source: 'Blatt 1, Aufgabe 3 c)',
      points: 4,
      task: r`Untersuche $c_n := \sqrt{n+1} - \sqrt{n}$ auf Konvergenz und bestimme ggf. den Grenzwert.`,
      hint: r`Erweitere mit $\sqrt{n+1} + \sqrt{n}$.`,
      solution: r`$$c_n = \frac{(\sqrt{n+1} - \sqrt{n})(\sqrt{n+1} + \sqrt{n})}{\sqrt{n+1} + \sqrt{n}} = \frac{1}{\sqrt{n+1} + \sqrt{n}} \le \frac{1}{2\sqrt{n}}$$

Zu $\varepsilon > 0$ wähle $N > \frac{1}{4\varepsilon^2}$; dann ist $0 < c_n \le \frac{1}{2\sqrt{n}} \le \varepsilon$ für $n \ge N$. Also $\lim_{n\to\infty} c_n = 0$.`,
    },
    {
      id: 'komplexe-folge',
      title: 'Eine komplexe Folge',
      source: 'angelehnt an Blatt 1, Aufgabe 3 a)',
      points: 3,
      task: r`Untersuche $a_n := \frac{i^n}{n}$ in $\C$ auf Konvergenz.`,
      solution: r`Es ist $|a_n - 0| = \frac{|i|^n}{n} = \frac{1}{n}$, und $\left(\frac1n\right)$ ist eine reelle Nullfolge. Also konvergiert $(a_n)$ gegen $0$ – obwohl $(i^n)$ selbst divergiert.`,
    },
    {
      id: 'fakultaet-potenz',
      title: 'Fakultät gegen Potenz',
      source: 'angelehnt an Blatt 1, Aufgabe 3 b)',
      points: 4,
      task: r`Untersuche $b_n := \frac{n!}{n^n}$ auf Konvergenz.`,
      hint: r`Schreibe $b_n$ als Produkt von $n$ Brüchen und schätze ab.`,
      solution: r`$$b_n = \frac{1}{n} \cdot \frac{2}{n} \cdot \ldots \cdot \frac{n}{n} \le \frac{1}{n} \cdot 1 \cdot \ldots \cdot 1 = \frac{1}{n}$$

Also $0 < b_n \le \frac1n$, und da $\left(\frac1n\right)$ Nullfolge ist, folgt $\lim_{n\to\infty} b_n = 0$. (Die Kehrfolge $\frac{n^n}{n!} \ge n$ ist unbeschränkt, also divergent.)`,
    },
    {
      id: 'rationaler-ausdruck',
      title: 'Grenzwert eines Bruchs',
      points: 3,
      task: r`Bestimme $\lim_{n \to \infty} \frac{3n^2 + 2n}{n^2 + 1}$ mit den Grenzwertsätzen.`,
      solution: r`Kürzen mit $n^2$: $\frac{3n^2 + 2n}{n^2 + 1} = \frac{3 + \frac{2}{n}}{1 + \frac{1}{n^2}}$.

Zähler $\to 3 + 0 = 3$, Nenner $\to 1 + 0 = 1 \ne 0$. Nach den Grenzwertsätzen ist der Grenzwert $\frac{3}{1} = 3$.`,
    },
    {
      id: 'rekursive-folge',
      title: 'Rekursive Folge mit dem Monotoniekriterium',
      points: 6,
      task: r`Sei $a_1 := 1$ und $a_{n+1} := \sqrt{2 + a_n}$. Zeige, dass $(a_n)$ konvergiert, und bestimme den Grenzwert.`,
      hint: r`Zeige per Induktion $a_n \le 2$ und $a_n \le a_{n+1}$.`,
      solution: r`**Beschränkt:** $a_1 = 1 \le 2$, und aus $a_n \le 2$ folgt $a_{n+1} = \sqrt{2 + a_n} \le \sqrt{4} = 2$.

**Monoton wachsend:** Wegen $0 < a_n \le 2$ ist $a_n^2 \le 2a_n \le 2 + a_n$, also $a_n \le \sqrt{2 + a_n} = a_{n+1}$.

Nach dem Monotoniekriterium konvergiert $(a_n)$ gegen ein $a \in [1, 2]$. Grenzübergang in $a_{n+1}^2 = 2 + a_n$ liefert $a^2 = 2 + a$, also $a = 2$ oder $a = -1$. Wegen $a \ge 1$ ist $a = 2$.`,
    },
    {
      id: 'konvergent-cauchy-beweis',
      title: 'Konvergent ⇒ Cauchy',
      source: 'Übung 9.9',
      points: 4,
      task: r`Zeige: Jede konvergente Folge in einem metrischen Raum $(X, d)$ ist eine Cauchy-Folge.`,
      solution: r`Sei $\lim a_n = a$ und $\varepsilon > 0$. Wähle $N$ so, dass $d(a_n, a) \le \frac{\varepsilon}{2}$ für alle $n \ge N$. Für $m, n \ge N$ gilt dann mit Dreiecksungleichung und Symmetrie

$$d(a_m, a_n) \le d(a_m, a) + d(a, a_n) \le \frac{\varepsilon}{2} + \frac{\varepsilon}{2} = \varepsilon.$$`,
    },
  ],
});
