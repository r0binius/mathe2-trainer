import { topic } from '@/domain/content/build';

const r = String.raw;

/** Chapter 11 of the lecture notes: continuous functions and the theorems about them. */
export const stetigkeit = topic({
  id: 'stetigkeit',
  chapter: '11',
  title: 'Stetige Funktionen',
  summary:
    'Folgenstetigkeit, Zwischenwertsatz, Bisektion, Extrema auf kompakten Intervallen, Fixpunkte.',
  definitions: [
    {
      id: 'stetig',
      title: 'Stetigkeit (in einem Punkt, auf X)',
      ref: 'Definition 260',
      statement: r`Seien $(X, d_X)$, $(Y, d_Y)$ metrische Räume, $a \in X$ und $f : X \to Y$.

- $f$ heißt **stetig in $a$**, wenn für **jede** Folge $(a_n)$ in $X$ mit $\lim_{n\to\infty} a_n = a$ gilt:
$\lim_{n\to\infty} f(a_n) = f(a)$.
- $f$ heißt **unstetig in $a$**, wenn es eine Folge $(a_n)$ mit $a_n \to a$ gibt, für die $f(a_n)$ **nicht** gegen $f(a)$ konvergiert.
- $f$ heißt **stetig auf $X$**, wenn $f$ in jedem $a \in X$ stetig ist.

$C(X, Y)$ bezeichnet die Menge aller stetigen Abbildungen von $X$ nach $Y$.`,
      note: r`Kurz: $f\left(\lim a_n\right) = \lim f(a_n)$ – Grenzwert und Funktion vertauschen. Um Unstetigkeit zu zeigen, genügt **eine** Folge; für Stetigkeit braucht man **alle**.`,
    },
    {
      id: 'grenzwert-funktion',
      title: 'Grenzwert einer Funktion',
      ref: 'Definition 285',
      statement: r`Seien $X, Y$ metrische Räume, $f : X \to Y$, $a \in X$ und $y \in Y$. $f$ hat in $a$ den **Grenzwert** $y$, in Zeichen

$$\lim_{x \to a} f(x) = y,$$

wenn für **jede** Folge $(x_n)$ in $X$ mit $\lim_{n\to\infty} x_n = a$ gilt: $\lim_{n\to\infty} f(x_n) = y$.`,
      note: r`Damit: $f$ stetig in $a$ $\Leftrightarrow$ $\lim_{x\to a} f(x) = f(a)$. Nähert man sich nur von links bzw. rechts, spricht man vom links- bzw. rechtsseitigen Grenzwert $\lim_{x\to a-}$, $\lim_{x \to a+}$.`,
    },
    {
      id: 'kompaktes-intervall',
      title: 'Kompaktes Intervall',
      ref: 'Definition 282',
      statement: r`Ein **abgeschlossenes und beschränktes** Intervall $[a, b] \subset \R$ heißt **kompaktes Intervall**.`,
    },
    {
      id: 'fixpunkt-kontraktion',
      title: 'Fixpunkt und Kontraktion',
      ref: 'Blatt 4, Aufgabe 3',
      statement: r`Sei $f : [a, b] \to [a, b]$.

- Ein $x \in [a,b]$ mit $f(x) = x$ heißt **Fixpunkt** von $f$.
- $f$ heißt **Kontraktion**, wenn es ein $q \in\, ]0, 1[$ gibt mit
$$|f(x) - f(y)| \le q\,|x - y| \quad \text{für alle } x, y \in [a, b].$$`,
    },
    {
      id: 'lipschitz',
      title: 'Lipschitz-Bedingung',
      ref: 'Blatt 6, Aufgabe 2 c)',
      statement: r`Seien $(X, d_X)$, $(Y, d_Y)$ metrische Räume. $f : X \to Y$ erfüllt eine **Lipschitz-Bedingung** mit Konstante $L > 0$, wenn für alle $x, y \in X$ gilt

$$d_Y(f(x), f(y)) \le L \cdot d_X(x, y).$$`,
      note: r`Jede solche Funktion ist stetig auf $X$.`,
    },
  ],
  theorems: [
    {
      id: 'rechenregeln',
      title: 'Rechenregeln für stetige Funktionen',
      ref: 'Theorem 266',
      statement: r`Seien $(X, d_X)$ ein metrischer Raum und $f, g \in C(X, \K)$, $\lambda, \mu \in \K$. Dann gilt:

- $\lambda f + \mu g$ ist stetig ($C(X, \K)$ ist ein $\K$-Vektorraum),
- $f g$ ist stetig,
- $\dfrac{f}{g}$ ist stetig auf $X \setminus N_g$, wobei $N_g = g^{-1}(\{0\})$ die Nullstellenmenge von $g$ ist.`,
      note: r`Folge: Polynome und rationale Funktionen sind auf ihrem Definitionsbereich stetig.`,
    },
    {
      id: 'komposition',
      title: 'Komposition stetiger Funktionen',
      ref: 'Theorem 272',
      statement: r`Seien $f \in C(X, Y)$ und $g \in C(Y, Z)$. Dann ist $g \circ f \in C(X, Z)$.`,
    },
    {
      id: 'potenzreihen-stetig',
      title: 'Stetigkeit von Potenzreihen',
      ref: 'Theorem 273',
      statement: r`Jede durch eine Potenzreihe mit Konvergenzradius $\rho > 0$ dargestellte Funktion ist **im Inneren ihres Konvergenzbereichs stetig**.`,
      note: r`Damit sind $\exp$, $\sin$, $\cos$ auf ganz $\R$ (bzw. $\C$) stetig.`,
    },
    {
      id: 'bisektion',
      title: 'Nullstellensatz (Bisektionsverfahren)',
      ref: 'Theorem 275',
      statement: r`Sei $f : [a, b] \to \R$ eine **stetige** Funktion mit $f(a) < 0$ und $f(b) > 0$. Dann gibt es ein $x_0$ mit $a < x_0 < b$ und

$$f(x_0) = 0.$$`,
      note: r`Beweis konstruktiv: Intervall halbieren, die Hälfte mit Vorzeichenwechsel behalten. Nach $n$ Schritten hat das Intervall die Länge $\frac{b - a}{2^n}$.`,
    },
    {
      id: 'zwischenwertsatz',
      title: 'Zwischenwertsatz',
      ref: 'Theorem 280',
      statement: r`Sei $f : [a, b] \to \R$ **stetig**. Dann nimmt $f$ **jeden Wert zwischen $f(a)$ und $f(b)$** an.`,
      note: r`Beweis: Wende den Nullstellensatz auf $g_c(x) := f(x) - c$ an.`,
    },
    {
      id: 'min-max',
      title: 'Satz vom Minimum und Maximum',
      ref: 'Theorem 283 a)',
      statement: r`Seien $[a, b] \subset \R$ ein **kompaktes** Intervall und $f : [a, b] \to \R$ **stetig**. Dann nimmt $f$ auf $[a, b]$ ein Minimum und ein Maximum an, d. h. es gibt $x_m, x_M \in [a, b]$ mit

$$f(x_m) = \inf\{f(x) \mid x \in [a, b]\}, \qquad f(x_M) = \sup\{f(x) \mid x \in [a, b]\}.$$`,
      note: r`Beide Voraussetzungen sind nötig: $f(x) = \frac1x$ auf $]0, 1]$ (nicht abgeschlossen) hat kein Maximum.`,
    },
    {
      id: 'umgebung-ungleich-null',
      title: 'Lokale Nullstellenfreiheit und Umkehrfunktion',
      ref: 'Theorem 283 b), c)',
      statement: r`Sei $f : [a, b] \to \R$ stetig.

- Ist $f(p) \ne 0$ für ein $p \in [a, b]$, so gibt es ein $\varepsilon > 0$ mit $f(x) \ne 0$ für alle $x \in [a,b]$ mit $|p - x| \le \varepsilon$.
- Ist $f$ streng monoton, so bildet $f$ das Intervall $[a, b]$ **bijektiv** auf $[f(a), f(b)]$ ab, und die Umkehrfunktion $f^{-1}$ ist ebenfalls streng monoton und **stetig**.`,
    },
    {
      id: 'lineare-abbildungen',
      title: 'Stetigkeit linearer Abbildungen',
      ref: 'Lemma 261 und Folgerung',
      statement: r`Für jede Matrix $A = (\alpha_{ij}) \in M(m, n; \C)$ und $\|A\|_\infty := \max_{i,j} |\alpha_{ij}|$ gilt

$$\|Ay\|_\infty \le n\, \|A\|_\infty\, \|y\|_\infty \quad \text{für alle } y \in \C^n.$$

Folge: Alle (affin-)linearen Abbildungen $\C^n \to \C^m$ sind stetig, insbesondere Addition, Projektionen und Multiplikation.`,
    },
    {
      id: 'fixpunktsatz',
      title: 'Fixpunktsatz für Kontraktionen',
      ref: 'Blatt 4, Aufgabe 3',
      statement: r`Sei $f : [a, b] \to [a, b]$ eine Kontraktion mit Konstante $q \in\, ]0,1[$ und $x_0 \in [a, b]$ beliebig. Dann konvergiert die Folge $x_n := f(x_{n-1})$ gegen ein $x \in [a, b]$ mit

$$f(x) = x \qquad \text{und} \qquad |x - x_m| \le \frac{q^m}{1 - q}\, |x_1 - x_0| \quad \text{für alle } m \in \N.$$`,
      note: r`Beweisidee: $|x_k - x_{k-1}| \le q^{k-1} |x_1 - x_0|$, also ist $(x_n)$ eine Cauchy-Folge (geometrische Reihe).`,
    },
    {
      id: 'fixpunkt-stetig',
      title: 'Fixpunkt einer stetigen Selbstabbildung',
      ref: 'Blatt 7, Aufgabe 1',
      statement: r`Jede **stetige** Funktion $f : [0, 1] \to [0, 1]$ besitzt einen Fixpunkt $x_0$ mit $f(x_0) = x_0$.`,
      note: r`Beweis mit $g(x) := f(x) - x$: $g(0) \ge 0$, $g(1) \le 0$, Zwischenwertsatz.`,
    },
  ],
  claims: [
    {
      id: 'heaviside',
      statement: r`Die Funktion $H : \R \to \R$ mit $H(x) = 0$ für $x < 0$ und $H(x) = 1$ für $x \ge 0$ ist in $0$ stetig.`,
      holds: false,
      reason: r`$a_n = -\frac1n \to 0$, aber $H(a_n) = 0 \not\to 1 = H(0)$.`,
    },
    {
      id: 'triviale-metrik-stetig',
      statement: r`Trägt $\R$ als Definitionsbereich die triviale Metrik, so ist **jede** Funktion $h : \R \to \R$ stetig.`,
      holds: true,
      reason: r`Bezüglich $d_{\mathrm{triv}}$ sind konvergente Folgen schließlich konstant gleich $a$; dann ist auch $h(a_n)$ schließlich $h(a)$.`,
      ref: 'Blatt 6, Aufgabe 1 c)',
    },
    {
      id: 'zws-unstetig',
      statement: r`Der Zwischenwertsatz gilt auch ohne die Voraussetzung der Stetigkeit.`,
      holds: false,
      reason: r`Die Sprungfunktion $H$ auf $[-1, 1]$ nimmt den Wert $\frac12$ nicht an.`,
    },
    {
      id: 'offenes-intervall-max',
      statement: r`Jede stetige Funktion $f : \,]0, 1[\, \to \R$ nimmt ein Maximum an.`,
      holds: false,
      reason: r`$f(x) = x$ hat auf $]0,1[$ das Supremum $1$, nimmt es aber nicht an. Der Satz braucht ein **kompaktes** Intervall.`,
    },
    {
      id: 'betrag-bisektion',
      statement: r`Mit dem Bisektionsverfahren lässt sich die Nullstelle von $f(x) = |x|$ auf $[-2, 3]$ finden.`,
      holds: false,
      reason: r`$f(-2) = 2 > 0$ und $f(3) = 3 > 0$: Es gibt keinen Vorzeichenwechsel, die Voraussetzung ist verletzt.`,
      ref: 'Blatt 6, Aufgabe 3 ii)',
    },
    {
      id: 'stetigkeit-hinreichend',
      statement: r`Die Stetigkeit ist für das Bisektionsverfahren eine hinreichende, aber keine notwendige Bedingung.`,
      holds: true,
      reason: r`Stetigkeit (mit Vorzeichenwechsel) garantiert eine Nullstelle. Es gibt aber auch unstetige Funktionen mit Nullstellen, die das Verfahren zufällig findet.`,
      ref: 'Blatt 6, Aufgabe 3 i)',
    },
    {
      id: 'indikator-q',
      statement: r`Die Indikatorfunktion $1_\Q$ von $\Q$ ist in jedem rationalen Punkt stetig.`,
      holds: false,
      reason: r`Sie ist nirgends stetig: Zu $a \in \Q$ gibt es irrationale $a_n \to a$ (z. B. $a + \frac{\sqrt2}{n}$) mit $1_\Q(a_n) = 0 \ne 1$.`,
      ref: 'Blatt 6, Aufgabe 2 b)',
    },
    {
      id: 'verknuepfungen',
      statement: r`Summe, Produkt und Verkettung stetiger Funktionen sind wieder stetig.`,
      holds: true,
      reason: r`Theoreme 266 und 272.`,
    },
    {
      id: 'cos-eins-durch-x',
      statement: r`Es gibt ein $a \in \R$, sodass $g(x) = \cos\frac1x$ für $x \ne 0$, $g(0) = a$ in $0$ stetig ist.`,
      holds: false,
      reason: r`$x_n = \frac{1}{2\pi n} \to 0$ mit $g(x_n) = 1$, aber $y_n = \frac{1}{(2n+1)\pi} \to 0$ mit $g(y_n) = -1$. Kein $a$ passt zu beiden.`,
      ref: 'Blatt 6, Aufgabe 2 a)',
    },
    {
      id: 'umkehrfunktion-stetig',
      statement: r`Die Umkehrfunktion einer stetigen, streng monotonen Funktion $f : [a,b] \to \R$ ist stetig.`,
      holds: true,
      reason: r`Theorem 283 c). So erhält man z. B. die Stetigkeit von $\ln$ und der Wurzelfunktionen.`,
    },
  ],
  problems: [
    {
      id: 'unstetig-r2',
      title: 'Unstetigkeit im Nullpunkt',
      source: 'Blatt 6, Aufgabe 1 b)',
      points: 5,
      task: r`Untersuche $g : \R^2 \to \R$ mit $g(x, y) = \frac{xy}{x^2 + y^2}$ für $(x,y) \ne (0,0)$ und $g(0,0) = 0$ auf Stetigkeit (Maximummetrik auf $\R^2$).`,
      solution: r`**Außerhalb von $(0,0)$** ist $g$ als rationale Funktion mit nullstellenfreiem Nenner stetig.

**In $(0,0)$ unstetig:** Die Folge $a_n := \left(\frac1n, \frac1n\right)$ konvergiert bezüglich $d_\infty$ gegen $(0, 0)$, denn $d_\infty(a_n, 0) = \frac1n \to 0$. Aber

$$g(a_n) = \frac{\frac{1}{n^2}}{\frac{2}{n^2}} = \frac12 \not\to 0 = g(0, 0).$$`,
    },
    {
      id: 'lipschitz-stetig',
      title: 'Lipschitz-Bedingung impliziert Stetigkeit',
      source: 'Blatt 6, Aufgabe 2 c)',
      points: 4,
      task: r`Sei $f : X \to Y$ mit $d_Y(f(x), f(y)) \le L\, d_X(x, y)$ für alle $x, y \in X$ und ein $L > 0$. Zeige, dass $f$ stetig auf $X$ ist.`,
      solution: r`Sei $a \in X$ und $(a_n)$ eine Folge mit $a_n \to a$, d. h. $d_X(a_n, a) \to 0$. Dann gilt

$$0 \le d_Y(f(a_n), f(a)) \le L \cdot d_X(a_n, a) \to 0.$$

Also ist $(d_Y(f(a_n), f(a)))$ eine Nullfolge, d. h. $f(a_n) \to f(a)$. Da $a$ und die Folge beliebig waren, ist $f$ stetig auf $X$.`,
    },
    {
      id: 'bisektion-schritte',
      title: 'Bisektion: Anwendbarkeit und Schrittzahl',
      source: 'Blatt 6, Aufgabe 3 iii)',
      points: 6,
      task: r`Lässt sich das Bisektionsverfahren auf $f : \left[\frac{1}{10}, 1\right] \to \R$, $f(x) = \ln\left(x + \frac12\right)$ anwenden? Nach wie vielen Iterationen ist die Nullstelle $x_0 = \frac12$ garantiert auf $20$ Nachkommastellen eingeschlossen?`,
      solution: r`**Anwendbar:** $f$ ist als Verkettung stetiger Funktionen stetig, $f\left(\frac{1}{10}\right) = \ln 0{,}6 < 0$ und $f(1) = \ln 1{,}5 > 0$.

**Schrittzahl:** Das Startintervall hat die Länge $\frac{9}{10}$, nach $n$ Halbierungen $\frac{9}{10 \cdot 2^n}$. Gefordert:

$$\frac{9}{10 \cdot 2^n} \le 10^{-20} \iff 2^n \ge 9 \cdot 10^{19} \iff n \ge \log_2(9 \cdot 10^{19}) \approx 66{,}3.$$

Also genügen $n = 67$ Iterationen.`,
    },
    {
      id: 'fixpunkt-beweis',
      title: 'Fixpunkt mit dem Zwischenwertsatz',
      source: 'Blatt 7, Aufgabe 1',
      points: 5,
      task: r`Sei $f : [0, 1] \to [0, 1]$ stetig. Zeige, dass $f$ einen Fixpunkt besitzt.`,
      solution: r`Setze $g : [0,1] \to \R$, $g(x) := f(x) - x$. $g$ ist stetig.

Wegen $f([0,1]) \subset [0,1]$ gilt $g(0) = f(0) \ge 0$ und $g(1) = f(1) - 1 \le 0$.

Ist $g(0) = 0$ oder $g(1) = 0$, so ist $0$ bzw. $1$ ein Fixpunkt. Andernfalls ist $g(0) > 0 > g(1)$, und nach dem Zwischenwertsatz gibt es ein $x_0 \in\, ]0, 1[$ mit $g(x_0) = 0$, also $f(x_0) = x_0$.`,
    },
    {
      id: 'fixpunktiteration',
      title: 'Fixpunktiteration',
      source: 'Blatt 4, Aufgabe 3 c), d)',
      points: 8,
      task: r`Sei $x_0 := 1$ und $x_n := 1 + e^{-x_{n-1}}$.

a) Zeige, dass $(x_n)$ gegen ein $x \in [1, 2]$ konvergiert, das $e^{-x} - x + 1 = 0$ erfüllt.
b) Nach wie vielen Schritten garantiert die Fehlerabschätzung $|x - x_m| \le 10^{-3}$?`,
      hint: r`$f(x) = 1 + e^{-x}$ ist auf $[1,2]$ eine Kontraktion mit $q = e^{-1}$ (Mittelwertsatz).`,
      solution: r`a) Sei $f(x) := 1 + e^{-x}$. Für $x \in [1,2]$ ist $1 < f(x) \le 1 + e^{-1} < 2$, also $f : [1,2] \to [1,2]$. Nach dem Mittelwertsatz ist $|f(x) - f(y)| = |f'(c)|\,|x - y| = e^{-c}|x - y| \le e^{-1}|x - y|$, also ist $f$ eine Kontraktion mit $q = \frac1e \approx 0{,}368$. Nach dem Fixpunktsatz konvergiert $(x_n)$ gegen ein $x \in [1,2]$ mit $x = 1 + e^{-x}$, d. h. $e^{-x} - x + 1 = 0$.

b) $|x_1 - x_0| = e^{-1}$. Gefordert: $\frac{q^m}{1 - q}|x_1 - x_0| = \frac{e^{-(m+1)}}{1 - e^{-1}} \le 10^{-3}$. Für $m = 6$ ist der Wert $\approx 1{,}44 \cdot 10^{-3}$, für $m = 7$ ist er $\approx 5{,}3 \cdot 10^{-4}$. Also genügen $m = 7$ Schritte. (Der Grenzwert ist $x \approx 1{,}2785$.)`,
    },
    {
      id: 'konjugation-stetig',
      title: 'Stetigkeit der komplexen Konjugation',
      source: 'Blatt 6, Aufgabe 1 a)',
      points: 3,
      task: r`Zeige, dass $f : \C \to \C$, $z \mapsto \overline{z}$ bezüglich $d(z, w) = |z - w|$ stetig ist.`,
      solution: r`Für alle $z, w \in \C$ gilt $|\overline z - \overline w| = |\overline{z - w}| = |z - w|$. $f$ erfüllt also eine Lipschitz-Bedingung mit $L = 1$ und ist damit stetig: Aus $z_n \to z$ folgt $|\overline{z_n} - \overline z| = |z_n - z| \to 0$.`,
    },
  ],
});
