import { topic } from '@/domain/content/build';

const r = String.raw;

/** Chapters 9.1 and 9.2 of the lecture notes: properties of the reals, metrics and norms. */
export const reelleZahlen = topic({
  id: 'reelle-zahlen',
  chapter: '9.1–9.2',
  title: 'Reelle Zahlen und metrische Räume',
  summary: 'Bernoulli, Archimedes, Dichtheit von ℚ, Metriken, Normen und Beschränktheit.',
  definitions: [
    {
      id: 'intervall',
      title: 'Intervall',
      ref: 'Definition 173',
      statement: r`Eine nichtleere Teilmenge $J \subset \R$ heißt **Intervall**, wenn für alle $a, b \in J$ mit $a \le b$ gilt:

$$a \le x \le b \;\Rightarrow\; x \in J.$$`,
      note: r`Schreibweisen des Skripts: $[a,b]$ abgeschlossen, $]a,b[$ offen, $[a,b[$ und $]a,b]$ halboffen.`,
    },
    {
      id: 'metrik',
      title: 'Metrik und metrischer Raum',
      ref: 'Definition 176',
      statement: r`Sei $X$ eine nichtleere Menge. Eine Funktion $d : X \times X \to \R$ heißt **Metrik** (Abstand, Distanz) auf $X$, wenn für alle $x, y, z \in X$ gilt:

- $d(x, x) = 0$
- **Trennung:** $x \ne y \Rightarrow d(x, y) > 0$
- **Symmetrie:** $d(x, y) = d(y, x)$
- **Dreiecksungleichung:** $d(x, y) \le d(x, z) + d(z, y)$

Das Paar $(X, d)$ heißt dann **metrischer Raum**.`,
    },
    {
      id: 'norm',
      title: 'Norm',
      ref: 'Definition 177',
      statement: r`Sei $V$ ein $\K$-Vektorraum ($\K \in \{\R, \C\}$). Eine Abbildung $\|\cdot\| : V \to \R$ heißt **Norm** auf $V$, wenn gilt:

- **Definitheit:** $\|x\| \ge 0$ für alle $x \in V$, und $\|x\| = 0 \Leftrightarrow x = 0$
- **Homogenität:** $\|\lambda x\| = |\lambda| \, \|x\|$ für alle $x \in V$, $\lambda \in \K$
- **Dreiecksungleichung:** $\|x + y\| \le \|x\| + \|y\|$ für alle $x, y \in V$`,
      note: r`Das Skript schreibt die Dreiecksungleichung als $\|x - y\| \le \|x\| + \|y\|$; wegen $\|-y\| = \|y\|$ ist das gleichwertig.`,
    },
    {
      id: 'euklid-max',
      title: 'Euklidische Norm und Maximumnorm',
      ref: 'Beispiele 179, 182',
      statement: r`Auf $\K^n$ sind für $x = (x_1, \dots, x_n)$ definiert:

$$\|x\|_2 := \sqrt{\sum_{k=1}^{n} |x_k|^2} \qquad \text{(euklidische Norm)}$$

$$\|x\|_\infty := \max_{k=1,\dots,n} |x_k| \qquad \text{(Maximumnorm)}$$`,
      note: r`Es gilt $\|x\|_\infty \le \|x\|_2 \le \sqrt{n}\,\|x\|_\infty$ (Übung 9.4).`,
    },
    {
      id: 'induzierte-metrik',
      title: 'Von einer Norm induzierte Metrik',
      ref: 'Proposition 183, Beispiel 184',
      statement: r`Ist $(V, \|\cdot\|)$ ein normierter Vektorraum, so definiert

$$d(x, y) := \|x - y\|$$

eine Metrik auf $V$. Aus $\|\cdot\|_2$ und $\|\cdot\|_\infty$ entstehen so die **euklidische Metrik** $d_2$ und die **Maximummetrik** $d_\infty$ auf $\K^n$.`,
    },
    {
      id: 'triviale-metrik',
      title: 'Triviale Metrik',
      ref: 'Übung 9.6',
      statement: r`Auf einer beliebigen nichtleeren Menge $X$ ist die **triviale Metrik** definiert durch

$$d_{\mathrm{triv}}(x, y) := \begin{cases} 0, & x = y \\ 1, & x \ne y \end{cases}$$`,
      note: r`Sie stammt von **keiner** Norm. Bezüglich $d_{\mathrm{triv}}$ konvergiert eine Folge genau dann, wenn sie schließlich konstant ist.`,
    },
    {
      id: 'durchmesser',
      title: 'Durchmesser und beschränkte Menge',
      ref: 'Definition 185',
      statement: r`Seien $(X, d)$ ein metrischer Raum und $A \subset X$.

- $\operatorname{diam}(A) := \sup\{d(x, y) \mid x, y \in A\} \in \R \cup \{\infty\}$ heißt **Durchmesser** von $A$.
- $A$ heißt **beschränkt**, wenn $\operatorname{diam}(A) < \infty$ ist, sonst **unbeschränkt**.`,
    },
    {
      id: 'umgebung',
      title: 'Offene ε-Umgebung',
      ref: 'Definition 286',
      statement: r`Seien $(X, d)$ ein metrischer Raum, $a \in X$ und $\varepsilon > 0$. Dann heißt

$$U_\varepsilon(a) := \{x \in X \mid d(x, a) < \varepsilon\}$$

**offene $\varepsilon$-Umgebung** von $a$.`,
    },
  ],
  theorems: [
    {
      id: 'bernoulli',
      title: 'Bernoulli-Ungleichung',
      ref: 'Theorem 164',
      statement: r`Seien $n \in \N_0$ und $\delta \ge -1$. Dann ist

$$(1 + \delta)^n \ge 1 + n\delta.$$`,
      note: r`Beweis per Induktion; im Schritt braucht man $1 + \delta \ge 0$ – daher die Voraussetzung $\delta \ge -1$.`,
    },
    {
      id: 'archimedes',
      title: 'Archimedisches Axiom',
      ref: 'Theorem 165',
      statement: r`Seien $x > 0$ und $y > 0$. Dann gibt es ein $n \in \N$ mit

$$n x > y.$$`,
    },
    {
      id: 'archimedes-folgerungen',
      title: 'Folgerungen aus dem Archimedischen Axiom',
      ref: 'Korollare 166–168',
      statement: r`- Zu jedem $\varepsilon > 0$ gibt es ein $n \in \N$ mit $\frac{1}{n} < \varepsilon$.
- Ist $b > 1$, so gibt es zu jedem $R > 0$ ein $n \in \N$ mit $b^n > R$.
- Ist $0 < b < 1$, so gibt es zu jedem $\varepsilon > 0$ ein $n \in \N$ mit $0 < b^n < \varepsilon$.`,
      note: r`Die zweite Aussage folgt aus Bernoulli: $b^n = (1 + \delta)^n \ge 1 + n\delta$ mit $\delta = b - 1 > 0$.`,
    },
    {
      id: 'q-dicht',
      title: 'ℚ liegt dicht in ℝ',
      ref: 'Theorem 169',
      statement: r`Seien $a, b \in \R$ mit $a < b$. Dann gibt es eine rationale Zahl $q \in \Q$ mit

$$a < q < b.$$`,
      note: r`Trotzdem ist $\Q$ nicht vollständig: $\sup\{x \in \Q \mid x^2 < 2\} = \sqrt{2} \notin \Q$.`,
    },
    {
      id: 'kleiner-jedes-epsilon',
      title: 'Kleiner als jedes ε',
      ref: 'Theorem 172',
      statement: r`Sei $x \ge 0$ eine reelle Zahl mit $x \le \varepsilon$ für **jedes** $\varepsilon > 0$. Dann ist $x = 0$.`,
      note: r`Standardtrick in $\varepsilon$-Beweisen, z. B. für die Eindeutigkeit von Grenzwerten.`,
    },
    {
      id: 'normvergleich',
      title: 'Vergleich von Maximum- und Euklidnorm',
      ref: 'Übung 9.4 b)',
      statement: r`Für alle $x \in \K^n$ gilt

$$\|x\|_\infty \le \|x\|_2 \le \sqrt{n}\, \|x\|_\infty.$$`,
      note: r`Folge: Eine Folge in $\K^n$ konvergiert bezüglich $d_2$ genau dann, wenn sie bezüglich $d_\infty$ konvergiert.`,
    },
  ],
  claims: [
    {
      id: 'bernoulli-negativ',
      statement: r`Die Bernoulli-Ungleichung $(1+\delta)^n \ge 1 + n\delta$ gilt für alle $\delta \in \R$ und $n \in \N_0$.`,
      holds: false,
      reason: r`Sie braucht $\delta \ge -1$. Gegenbeispiel: $\delta = -4$, $n = 3$ ergibt $(1+\delta)^3 = -27$, aber $1 + 3\delta = -11$.`,
    },
    {
      id: 'q-vollstaendig',
      statement: r`Jede nach oben beschränkte Menge rationaler Zahlen hat ein Supremum in $\Q$.`,
      holds: false,
      reason: r`$\sup\{x \in \Q \mid x^2 < 2\} = \sqrt{2} \notin \Q$. $\Q$ ist nicht vollständig.`,
      ref: 'Beispiel 171',
    },
    {
      id: 'trivial-norm',
      statement: r`Die triviale Metrik auf $\R^n$ wird von einer Norm induziert.`,
      holds: false,
      reason: r`Wäre $d_{\mathrm{triv}}(x, y) = \|x - y\|$, so müsste $\|\alpha x\| = |\alpha|\,\|x\|$ gelten; aber $d_{\mathrm{triv}}(\alpha x, 0) = 1$ für alle $\alpha \ne 0$, $x \ne 0$.`,
      ref: 'Übung 9.6',
    },
    {
      id: 'max-euklid',
      statement: r`Für alle $x \in \R^n$ gilt $\|x\|_\infty \le \|x\|_2$.`,
      holds: true,
      reason: r`$\|x\|_\infty^2 = \max_k |x_k|^2 \le \sum_k |x_k|^2 = \|x\|_2^2$.`,
    },
    {
      id: 'metrik-negativ',
      statement: r`Eine Metrik kann negative Werte annehmen.`,
      holds: false,
      reason: r`$d(x,x) = 0$ und $d(x,y) > 0$ für $x \ne y$, also stets $d \ge 0$.`,
    },
    {
      id: 'rational-zwischen',
      statement: r`Zwischen zwei verschiedenen reellen Zahlen liegen unendlich viele rationale Zahlen.`,
      holds: true,
      reason: r`Zwischen $a < b$ liegt ein $q_1 \in \Q$; zwischen $a$ und $q_1$ wieder eines usw. (Theorem 169 wiederholt anwenden).`,
    },
    {
      id: 'abstand-r2',
      statement: r`Die Punkte $(1, 1)$ und $(4, -3)$ haben in der Maximummetrik den Abstand $5$.`,
      holds: false,
      reason: r`$d_\infty = \max\{|1-4|, |1-(-3)|\} = \max\{3, 4\} = 4$. Der euklidische Abstand ist $\sqrt{9 + 16} = 5$.`,
      ref: 'Übung 9.5',
    },
    {
      id: 'beschraenkt-intervall',
      statement: r`Das Intervall $]0, 1[$ ist bezüglich $d(x,y) = |x - y|$ beschränkt mit Durchmesser $1$.`,
      holds: true,
      reason: r`$\sup\{|x - y| \mid x, y \in\, ]0,1[\} = 1$; das Supremum wird nicht angenommen, ist aber endlich.`,
    },
  ],
  problems: [
    {
      id: 'bernoulli-beweis',
      title: 'Bernoulli-Ungleichung beweisen',
      source: 'Theorem 164',
      points: 5,
      task: r`Beweise per vollständiger Induktion: Für alle $n \in \N_0$ und $\delta \ge -1$ gilt $(1+\delta)^n \ge 1 + n\delta$.`,
      solution: r`**Induktionsanfang** $n = 0$: $(1+\delta)^0 = 1 \ge 1 + 0$.

**Induktionsschritt:** Gelte $(1+\delta)^n \ge 1 + n\delta$. Wegen $1 + \delta \ge 0$ darf man die Ungleichung mit $1 + \delta$ multiplizieren:

$$(1+\delta)^{n+1} \ge (1 + n\delta)(1 + \delta) = 1 + (n+1)\delta + n\delta^2 \ge 1 + (n+1)\delta,$$

da $n\delta^2 \ge 0$.`,
    },
    {
      id: 'abstaende',
      title: 'Abstände in zwei Metriken',
      source: 'Übung 9.5',
      points: 3,
      task: r`Berechne den Abstand der Punkte $x = (1, 1)$ und $y = (4, -3)$ in $\R^2$ in der euklidischen Metrik und in der Maximummetrik.`,
      solution: r`$x - y = (-3, 4)$.

$d_2(x, y) = \sqrt{(-3)^2 + 4^2} = \sqrt{25} = 5$.

$d_\infty(x, y) = \max\{|-3|, |4|\} = 4$.`,
    },
    {
      id: 'pacman',
      title: 'Die Pacman-Metrik',
      source: 'Blatt 1, Aufgabe 5 a)',
      points: 6,
      task: r`Auf dem Spielfeld $F := \{1,\dots,m\} \times \{1,\dots,n\}$ können sich Figuren pro Schritt nur um ein Feld horizontal oder vertikal bewegen. Definiere eine dazu passende Abstandsfunktion $d : F \times F \to [0, \infty[$ und weise nach, dass $d$ eine Metrik ist.`,
      hint: r`Zähle die Schritte, die man mindestens braucht.`,
      solution: r`Für $p = (p_1, p_2)$, $q = (q_1, q_2)$ setze $d(p, q) := |p_1 - q_1| + |p_2 - q_2|$ (Anzahl der mindestens nötigen Schritte, „Manhattan-Metrik“).

- $d(p, p) = 0$ ist klar.
- Trennung: Ist $p \ne q$, so ist mindestens ein Summand $> 0$, also $d(p,q) > 0$.
- Symmetrie: $|p_i - q_i| = |q_i - p_i|$.
- Dreiecksungleichung: Für $s \in F$ gilt nach der Dreiecksungleichung des Betrags $|p_i - q_i| \le |p_i - s_i| + |s_i - q_i|$ für $i = 1, 2$; Addition liefert $d(p, q) \le d(p, s) + d(s, q)$.`,
    },
    {
      id: 'triviale-metrik-beweis',
      title: 'Die triviale Metrik ist eine Metrik',
      source: 'Übung 9.6 a)',
      points: 4,
      task: r`Zeige, dass $d_{\mathrm{triv}}$ auf einer nichtleeren Menge $X$ eine Metrik ist.`,
      solution: r`$d(x,x) = 0$, $d(x,y) = 1 > 0$ für $x \ne y$ und die Symmetrie folgen direkt aus der Definition.

Dreiecksungleichung $d(x,y) \le d(x,z) + d(z,y)$: Für $x = y$ ist die linke Seite $0$. Für $x \ne y$ ist die linke Seite $1$; $z$ kann nicht gleichzeitig gleich $x$ und gleich $y$ sein, also ist rechts mindestens ein Summand $1$.`,
    },
    {
      id: 'epsilon-n',
      title: 'Terminierung einer Schleife',
      source: 'nach Blatt 1, Aufgabe 6',
      points: 4,
      task: r`Ein Algorithmus halbiert in jedem Durchlauf eine Zahl $x$, beginnend mit $x = 1$, und stoppt, sobald $x < \varepsilon$ gilt. Terminiert er für **jedes** $\varepsilon > 0$, auch für $\varepsilon = 10^{-100000}$? Beweise deine Antwort.`,
      solution: r`Ja. Nach $n$ Durchläufen ist $x = \left(\tfrac{1}{2}\right)^n$. Wegen $0 < \tfrac12 < 1$ gibt es nach Korollar 168 zu jedem $\varepsilon > 0$ ein $n \in \N$ mit $0 < \left(\tfrac12\right)^n < \varepsilon$. Spätestens nach diesem $n$-ten Durchlauf stoppt der Algorithmus – unabhängig davon, wie klein $\varepsilon$ ist (in exakter Arithmetik).`,
    },
  ],
});
