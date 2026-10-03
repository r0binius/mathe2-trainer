import { topic } from '@/domain/content/build';

const r = String.raw;

/** Chapter 12 of the lecture notes: derivatives, extrema, the mean value theorem and Newton. */
export const differenzialrechnung = topic({
  id: 'differenzialrechnung',
  chapter: '12',
  title: 'Differenzialrechnung',
  summary: 'Lineare Approximation, Ableitungsregeln, Extrema, Mittelwertsatz, Taylor und Newton.',
  definitions: [
    {
      id: 'differenzierbar',
      title: 'Differenzierbarkeit (lineare Approximation)',
      ref: 'Definition 287',
      statement: r`Seien $J \subset \R$, $a \in J$ und $f : J \to \R$. $f$ heißt **differenzierbar im Punkt $a$**, wenn es eine $\varepsilon$-Umgebung $U_\varepsilon(a) \subset J$, eine Zahl $m_a \in \R$ und eine **in $a$ stetige** Funktion $r : U_\varepsilon(a) \to \R$ mit $r(a) = 0$ gibt, sodass

$$f(x) = f(a) + m_a \cdot (x - a) + r(x) \cdot (x - a) \quad \text{für alle } x \in U_\varepsilon(a).$$`,
      note: r`$f$ stimmt nahe $a$ „fast“ mit der Tangente überein; der Fehler $r(x)(x-a)$ geht schneller gegen $0$ als $x - a$. Äquivalent: Der Grenzwert $\lim_{x\to a} \frac{f(x) - f(a)}{x - a}$ existiert.`,
    },
    {
      id: 'ableitung',
      title: 'Ableitung (Differentialquotient) und Tangente',
      ref: 'Definition 288',
      statement: r`Ist $f$ in $a$ differenzierbar, so heißt

$$f'(a) := m_a = \lim_{x \to a} \frac{f(x) - f(a)}{x - a}$$

**Differentialquotient** oder **1. Ableitung** von $f$ in $a$. Die Gerade

$$T_a f : \R \to \R,\quad x \mapsto f(a) + f'(a)\,(x - a)$$

heißt **Tangente** an $f$ im Punkt $a$; $f'(a)$ ist ihre Steigung.`,
    },
    {
      id: 'ableitungsfunktion',
      title: 'Ableitungsfunktion, stetig differenzierbar',
      ref: 'Definition 298',
      statement: r`Ist $f : J \to \R$ auf dem ganzen Intervall $J$ differenzierbar, so heißt

$$f' : J \to \R,\quad x \mapsto f'(x)$$

die **1. Ableitung** von $f$ auf $J$; Schreibweise auch $\frac{d}{dx} f(x)$. Ist $f'$ **stetig**, heißt $f$ **stetig differenzierbar**.`,
    },
    {
      id: 'hoehere-ableitungen',
      title: 'Höhere Ableitungen, glatte Funktion',
      ref: 'Definition 305',
      statement: r`Induktiv: $f^{(0)} := f$ und $f^{(n)}(x) := \frac{d}{dx} f^{(n-1)}(x)$, sofern $f^{(n-1)}$ existiert und differenzierbar ist.

Existiert $f^{(n)}$ für jedes $n \in \N$, heißt $f$ **beliebig oft differenzierbar** oder **glatt**.`,
    },
    {
      id: 'extremum',
      title: 'Lokales und globales Extremum',
      ref: 'Definition 311',
      statement: r`Seien $(X, d)$ ein metrischer Raum und $f : X \to \R$.

- $x_0 \in X$ heißt **lokales Minimum** (bzw. **Maximum**) von $f$, wenn es eine $\varepsilon$-Umgebung $U_\varepsilon(x_0) \subset X$ gibt mit $f(x) \ge f(x_0)$ (bzw. $f(x) \le f(x_0)$) für alle $x \in U_\varepsilon(x_0)$.
- $x_0$ heißt **globales Minimum** (bzw. **Maximum**), wenn $f(x) \ge f(x_0)$ (bzw. $\le$) für **alle** $x \in X$ gilt.`,
    },
    {
      id: 'kritische-stelle',
      title: 'Kritische Stelle',
      ref: 'Definition 314',
      statement: r`Seien $J = \,]a, b[$ ein offenes Intervall und $f : J \to \R$ differenzierbar. Ein $x_0 \in J$ heißt **kritische Stelle** von $f$, wenn

$$f'(x_0) = 0.$$`,
      note: r`Die Tangente ist dort waagerecht. Notwendig, aber nicht hinreichend für ein Extremum: $f(x) = x^3$ hat in $0$ eine kritische Stelle, aber kein Extremum.`,
    },
    {
      id: 'stammfunktion',
      title: 'Stammfunktion',
      ref: 'Definition 323',
      statement: r`Seien $J \subset \R$ ein Intervall und $f : J \to \R$. Eine **differenzierbare** Funktion $F : J \to \R$ heißt **Stammfunktion** von $f$, wenn

$$F' = f.$$`,
    },
    {
      id: 'konvex',
      title: 'Konvexe und konkave Funktion',
      ref: 'Definition 330',
      statement: r`Seien $J \subset \R$ ein Intervall und $f : J \to \R$. $f$ heißt **konvex**, wenn für alle $x, y \in J$ und alle $t \in [0, 1]$ gilt

$$f(x + t(y - x)) \le f(x) + t\,(f(y) - f(x)).$$

$f$ heißt **konkav**, wenn $-f$ konvex ist.`,
      note: r`Anschaulich: Der Graph liegt zwischen $x$ und $y$ stets **unterhalb der Sekante**.`,
    },
    {
      id: 'taylorpolynom',
      title: 'Taylorpolynom',
      ref: 'Definition 369, Korollar 319',
      statement: r`Seien $J \subset \R$ ein Intervall, $a \in J$, $n \in \N_0$ und $f : J \to \R$ $n$-mal stetig differenzierbar. Dann heißt

$$T_n(f; a)(x) := \sum_{k=0}^{n} \frac{f^{(k)}(a)}{k!} (x - a)^k$$

das **$n$-te Taylorpolynom** von $f$ mit Entwicklungspunkt $a$.`,
    },
    {
      id: 'newton-iteration',
      title: 'Newton-Iteration',
      ref: 'Formel (86)',
      statement: r`Zu einer differenzierbaren Funktion $f$ und einem Startwert $x_0$ ist die **Newton-Folge** definiert durch

$$x_{n+1} := x_n - \frac{f(x_n)}{f'(x_n)}, \qquad n = 0, 1, 2, \dots$$

(vorausgesetzt $f'(x_n) \ne 0$).`,
      note: r`$x_{n+1}$ ist die Nullstelle der Tangente an $f$ in $x_n$.`,
    },
  ],
  theorems: [
    {
      id: 'diffbar-stetig',
      title: 'Differenzierbar ⇒ stetig',
      ref: 'Theorem 292',
      statement: r`Ist eine Funktion $f$ im Punkt $a$ differenzierbar, so ist $f$ in $a$ auch **stetig**.`,
      note: r`Umkehrung falsch: $|x|$ ist in $0$ stetig, aber nicht differenzierbar.`,
    },
    {
      id: 'linearitaet',
      title: 'Linearität der Ableitung',
      ref: 'Theorem 295',
      statement: r`Seien $f, g : J \to \R$ in $a \in J$ differenzierbar und $\lambda \in \R$. Dann sind auch $f + g$ und $\lambda f$ in $a$ differenzierbar, und es gilt

$$(f + g)'(a) = f'(a) + g'(a), \qquad (\lambda f)'(a) = \lambda f'(a).$$`,
    },
    {
      id: 'produkt-quotient',
      title: 'Produkt- und Quotientenregel',
      ref: 'Theorem 297',
      statement: r`Seien $f, g : J \to \R$ in $a \in J$ differenzierbar. Dann gilt:

**Produktregel:** $(fg)'(a) = f'(a)\,g(a) + f(a)\,g'(a)$

**Quotientenregel** (falls $g(a) \ne 0$): $$\left(\frac{f}{g}\right)'(a) = \frac{f'(a)\,g(a) - f(a)\,g'(a)}{g(a)^2}$$`,
    },
    {
      id: 'kettenregel',
      title: 'Kettenregel',
      ref: 'Theorem 302',
      statement: r`Seien $I, J$ Intervalle, $g : I \to J$ in $a \in I$ differenzierbar und $f : J \to \R$ in $b := g(a)$ differenzierbar. Dann ist $f \circ g$ in $a$ differenzierbar mit

$$(f \circ g)'(a) = f'(g(a)) \cdot g'(a).$$`,
      note: r`„Äußere Ableitung mal innere Ableitung.“`,
    },
    {
      id: 'umkehrfunktion',
      title: 'Ableitung der Umkehrfunktion',
      ref: 'Blatt 8, Aufgabe 1',
      statement: r`Seien $I, J$ Intervalle und $f : I \to J$ bijektiv und differenzierbar mit $f'(x_0) \ne 0$. Dann ist $f^{-1} : J \to I$ in $y_0 := f(x_0)$ differenzierbar mit

$$\left(f^{-1}\right)'(y_0) = \frac{1}{f'(x_0)}.$$`,
      note: r`Beispiele: $\ln'(y) = \frac{1}{y}$ und $\arctan'(y) = \frac{1}{1 + y^2}$.`,
    },
    {
      id: 'ableitungstabelle',
      title: 'Wichtige Ableitungen',
      ref: 'Beispiele in Kapitel 12, Blätter 7 und 8',
      statement: r`$$\begin{array}{l|l} f(x) & f'(x) \\ \hline x^n \ (n \in \Z) & n x^{n-1} \\ x^\alpha \ (x > 0) & \alpha x^{\alpha - 1} \\ e^x & e^x \\ \ln x & \frac1x \\ \sin x & \cos x \\ \cos x & -\sin x \\ \tan x & \frac{1}{\cos^2 x} = 1 + \tan^2 x \\ \arctan x & \frac{1}{1 + x^2} \end{array}$$`,
    },
    {
      id: 'potenzreihe-ableiten',
      title: 'Gliedweise Differentiation von Potenzreihen',
      ref: 'Theorem 299',
      statement: r`Sei $\sum_{n=0}^\infty c_n x^n$ eine Potenzreihe mit Konvergenzradius $\rho > 0$ und $0 < \varepsilon < \rho$. Dann ist $f(x) := \sum_{n=0}^{\infty} c_n x^n$ in jedem $x \in\, ]-\varepsilon, \varepsilon[$ differenzierbar mit

$$f'(x) = \sum_{n=1}^{\infty} c_n\, n\, x^{n-1}.$$`,
      note: r`So folgen sofort $\exp' = \exp$, $\sin' = \cos$, $\cos' = -\sin$.`,
    },
    {
      id: 'lhospital',
      title: 'Regel von l’Hospital',
      ref: 'Theorem 308',
      statement: r`Seien $f, g$ zwei in $a \in \R$ differenzierbare Funktionen mit $f(a) = g(a) = 0$ und $g'(a) \ne 0$. Dann gilt

$$\lim_{x \to a} \frac{f(x)}{g(x)} = \frac{f'(a)}{g'(a)}.$$`,
    },
    {
      id: 'notwendige-bedingung',
      title: 'Notwendige Bedingung für lokale Extrema',
      ref: 'Theorem 315',
      statement: r`Seien $J = \,]a, b[$ ein **offenes** Intervall und $f : J \to \R$ **differenzierbar** mit einem lokalen Extremum in $x_0 \in J$. Dann ist $x_0$ kritische Stelle von $f$, d. h. $f'(x_0) = 0$.`,
      note: r`Gilt nicht an Randpunkten und nicht an Stellen, wo $f$ nicht differenzierbar ist (z. B. $|x|$ in $0$).`,
    },
    {
      id: 'rolle',
      title: 'Satz von Rolle',
      ref: 'Theorem 318',
      statement: r`Seien $a < b$ und $f : [a, b] \to \R$ stetig, auf $]a, b[$ differenzierbar, mit $f(a) = f(b)$. Dann gibt es (mindestens) ein $c \in\, ]a, b[$ mit

$$f'(c) = 0.$$`,
    },
    {
      id: 'mittelwertsatz',
      title: 'Mittelwertsatz der Differenzialrechnung',
      ref: 'Korollar 320',
      statement: r`Seien $a < b$ und $f : [a, b] \to \R$ **stetig** und in $]a, b[$ **differenzierbar**. Dann existiert ein $c \in\, ]a, b[$ mit

$$\frac{f(b) - f(a)}{b - a} = f'(c).$$`,
      note: r`Irgendwo ist die Tangentensteigung gleich der Sekantensteigung.`,
    },
    {
      id: 'schrankensatz',
      title: 'Folgerungen aus dem Mittelwertsatz',
      ref: 'Korollare 321, 322',
      statement: r`$f$ erfülle die Voraussetzungen des Mittelwertsatzes.

- Gilt $m \le f'(x) \le M$ für alle $x \in\, ]a, b[$, so gilt für alle $a \le x \le y \le b$:
$m\,(y - x) \le f(y) - f(x) \le M\,(y - x)$.
- Gilt $f'(x) = 0$ für alle $x \in\, ]a, b[$, so ist $f$ **konstant**.`,
    },
    {
      id: 'stammfunktionen-konstante',
      title: 'Stammfunktionen unterscheiden sich um eine Konstante',
      ref: 'Theorem 325',
      statement: r`Sei $f : J \to \R$ eine Funktion auf einem Intervall $J$.

- Ist $F$ eine Stammfunktion von $f$ und $c \in \R$, so ist auch $F + c$ eine Stammfunktion.
- Sind $F_1$ und $F_2$ Stammfunktionen von $f$, so gibt es eine Konstante $c \in \R$ mit $F_2 = F_1 + c$.`,
    },
    {
      id: 'monotonie',
      title: 'Monotoniekriterium',
      ref: 'Theorem 326',
      statement: r`Sei $f : [a, b] \to \R$ stetig und auf $]a, b[$ differenzierbar. Dann gilt:

- $f' \ge 0$ auf $]a,b[$ $\Rightarrow$ $f$ monoton wachsend,
- $f' > 0$ auf $]a,b[$ $\Rightarrow$ $f$ **streng** monoton wachsend,
- $f' \le 0$ auf $]a,b[$ $\Rightarrow$ $f$ monoton fallend,
- $f' < 0$ auf $]a,b[$ $\Rightarrow$ $f$ **streng** monoton fallend.`,
    },
    {
      id: 'hinreichende-bedingung',
      title: 'Hinreichende Bedingung für lokale Extrema',
      ref: 'Theorem 327',
      statement: r`Sei $f : \,]a, b[\, \to \R$ zweimal differenzierbar und $x_0$ ein kritischer Punkt von $f$. Dann gilt:

- $f''(x_0) > 0$ $\Rightarrow$ $f$ hat in $x_0$ ein lokales **Minimum**,
- $f''(x_0) < 0$ $\Rightarrow$ $f$ hat in $x_0$ ein lokales **Maximum**.`,
      note: r`Bei $f''(x_0) = 0$ ist keine Aussage möglich ($x^3$ vs. $x^4$ in $0$).`,
    },
    {
      id: 'konvexitaet',
      title: 'Konvexitätskriterium',
      ref: 'Theorem 331',
      statement: r`Seien $J$ ein offenes Intervall und $f : J \to \R$ zweimal differenzierbar. Dann ist $f$ **genau dann konvex** auf $J$, wenn

$$f''(x) \ge 0 \quad \text{für alle } x \in J.$$`,
    },
    {
      id: 'taylor-lagrange',
      title: 'Taylorsche Formel mit Lagrange-Restglied',
      ref: 'Korollar 319',
      statement: r`Seien $n \in \N_0$, $a < b$ und $f : [a, b] \to \R$ $(n+1)$-mal differenzierbar. Dann gibt es zu $x \in\, ]a, b[$ ein $c \in\, ]a, b[$ mit

$$f(x) = \sum_{k=0}^{n} \frac{f^{(k)}(a)}{k!} (x - a)^k + \frac{f^{(n+1)}(c)}{(n+1)!} (x - a)^{n+1}.$$

Der letzte Term heißt $(n+1)$-tes **Lagrange-Restglied**.`,
      note: r`Für $n = 0$ ist das genau der Mittelwertsatz.`,
    },
    {
      id: 'newtonverfahren',
      title: 'Konvergenz des Newtonverfahrens',
      ref: 'Theorem 332',
      statement: r`Sei $f : [a, b] \to \R$ **zweimal differenzierbar und konvex** mit $f(a) < 0$ und $f(b) > 0$. Dann gilt:

- Es gibt **genau ein** $\xi \in\, ]a, b[$ mit $f(\xi) = 0$.
- Für jeden Startwert $x_0 \in [a, b]$ mit $f(x_0) \ge 0$ ist die Newton-Folge $x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}$ wohldefiniert (stets $f'(x_n) \ne 0$) und konvergiert **monoton fallend** gegen $\xi$.`,
    },
  ],
  claims: [
    {
      id: 'stetig-diffbar',
      statement: r`Jede stetige Funktion ist differenzierbar.`,
      holds: false,
      reason: r`$f(x) = |x|$ ist in $0$ stetig, aber links- und rechtsseitiger Differenzenquotient sind $-1$ und $+1$.`,
    },
    {
      id: 'kritisch-extremum',
      statement: r`Ist $f'(x_0) = 0$, so hat $f$ in $x_0$ ein lokales Extremum.`,
      holds: false,
      reason: r`$f(x) = x^3$: $f'(0) = 0$, aber $f$ ist streng monoton wachsend. Die Bedingung ist nur notwendig.`,
    },
    {
      id: 'extremum-kritisch',
      statement: r`Jedes lokale Extremum einer Funktion $f : \R \to \R$ liegt an einer kritischen Stelle.`,
      holds: false,
      reason: r`Nur wenn $f$ dort differenzierbar ist. $g(x) = |x|\,e^{-x^2}$ hat in $0$ ein globales Minimum, ist dort aber nicht differenzierbar.`,
      ref: 'Blatt 8, Aufgabe 2 b)',
    },
    {
      id: 'ableitung-null-konstant',
      statement: r`Ist $f : \,]a,b[\, \to \R$ differenzierbar mit $f' = 0$, so ist $f$ konstant.`,
      holds: true,
      reason: r`Korollar 322, eine Folgerung aus dem Mittelwertsatz. (Wichtig: Der Definitionsbereich ist ein Intervall.)`,
    },
    {
      id: 'produktregel-falsch',
      statement: r`Für differenzierbare $f, g$ gilt $(fg)' = f' g'$.`,
      holds: false,
      reason: r`Richtig ist $(fg)' = f'g + fg'$. Gegenbeispiel: $f = g = x$ gibt $(x^2)' = 2x \ne 1$.`,
    },
    {
      id: 'x-hoch-x',
      statement: r`Die Ableitung von $x \mapsto x^x$ auf $]0, \infty[$ ist $x \cdot x^{x-1}$.`,
      holds: false,
      reason: r`$x^x = \exp(x \ln x)$, also mit Ketten- und Produktregel $(x^x)' = x^x(\ln x + 1)$.`,
      ref: 'Blatt 7, Aufgabe 4 a) iii)',
    },
    {
      id: 'exp-konvex',
      statement: r`$\exp$ ist auf $\R$ konvex.`,
      holds: true,
      reason: r`$\exp'' = \exp > 0$, Konvexitätskriterium.`,
    },
    {
      id: 'streng-monoton-ableitung',
      statement: r`Ist $f$ differenzierbar und streng monoton wachsend, so gilt $f'(x) > 0$ für alle $x$.`,
      holds: false,
      reason: r`$f(x) = x^3$ ist streng monoton wachsend mit $f'(0) = 0$. Es gilt nur die Richtung $f' > 0 \Rightarrow$ streng monoton.`,
    },
    {
      id: 'zweite-ableitung-null',
      statement: r`Ist $f'(x_0) = 0$ und $f''(x_0) = 0$, so hat $f$ in $x_0$ kein Extremum.`,
      holds: false,
      reason: r`$f(x) = x^4$ hat in $0$ ein Minimum trotz $f''(0) = 0$. Bei $f'' = 0$ ist keine Aussage möglich.`,
    },
    {
      id: 'arctan-ableitung',
      statement: r`$\arctan'(y) = \frac{1}{1 + y^2}$ für alle $y \in \R$.`,
      holds: true,
      reason: r`Umkehrregel mit $\tan' = 1 + \tan^2$: $\arctan'(y) = \frac{1}{1 + \tan^2(\arctan y)} = \frac{1}{1 + y^2}$.`,
      ref: 'Blatt 8, Aufgabe 1 b)',
    },
    {
      id: 'ableitung-stetig',
      statement: r`Die Ableitung einer überall differenzierbaren Funktion ist stetig.`,
      holds: false,
      reason: r`$f(x) = x^2 \sin\frac1x$ ($f(0) = 0$) ist überall differenzierbar, aber $f'(x) = 2x\sin\frac1x - \cos\frac1x$ hat in $0$ keinen Grenzwert.`,
      ref: 'Blatt 7, Aufgabe 4 b)',
    },
    {
      id: 'mws-knick',
      statement: r`Der Mittelwertsatz gilt für $f(x) = |x|$ auf $[-1, 1]$.`,
      holds: false,
      reason: r`$f$ ist in $0 \in\, ]-1,1[$ nicht differenzierbar. Tatsächlich ist die Sekantensteigung $0$, aber $f'(c) = \pm 1$ für alle $c \ne 0$.`,
    },
  ],
  problems: [
    {
      id: 'ableiten-produkt',
      title: 'Ableiten mit Summen- und Produktregel',
      source: 'Blatt 7, Aufgabe 2 c)',
      points: 4,
      task: r`Bestimme $f'(x)$ für $f : \,]0, +\infty[\, \to \R$, $f(x) = \frac13 x^3 \exp x + 2x^2 - x\sqrt{x}$.`,
      solution: r`$x\sqrt{x} = x^{3/2}$ hat die Ableitung $\frac32 x^{1/2}$. Mit Produkt- und Summenregel:

$$f'(x) = x^2 e^x + \frac13 x^3 e^x + 4x - \frac32\sqrt{x}.$$

$f$ ist als Summe und Produkt differenzierbarer Funktionen überall auf $]0, \infty[$ differenzierbar.`,
    },
    {
      id: 'betragsfunktion',
      title: 'Summe zweier Beträge',
      source: 'Blatt 7, Aufgabe 3',
      points: 6,
      task: r`Sei $g(x) := |x| + |x - 1|$. Wo ist $g$ differenzierbar? Berechne $g'(x)$, wo die Ableitung existiert.`,
      solution: r`Fallunterscheidung:

- $x < 0$: $g(x) = -x - (x - 1) = 1 - 2x$, also $g'(x) = -2$.
- $0 < x < 1$: $g(x) = x - (x - 1) = 1$, also $g'(x) = 0$.
- $x > 1$: $g(x) = x + x - 1 = 2x - 1$, also $g'(x) = 2$.

In $x = 0$ sind die einseitigen Grenzwerte des Differenzenquotienten $-2$ und $0$, in $x = 1$ sind sie $0$ und $2$. Sie stimmen nicht überein, also ist $g$ in $0$ und $1$ **nicht** differenzierbar (aber stetig).`,
    },
    {
      id: 'ableitungen-drei',
      title: 'Drei Ableitungen',
      source: 'Blatt 7, Aufgabe 4 a)',
      points: 6,
      task: r`Berechne die Ableitungen von

a) $f_1(x) = \frac{1}{x^n}$ auf $\R \setminus \{0\}$ ($n \in \N$)
b) $f_2(x) = \frac{\cos x}{\sin x}$ auf $\R \setminus \pi\Z$
c) $f_3(x) = x^x$ auf $]0, +\infty[$`,
      solution: r`a) Quotientenregel: $f_1'(x) = \frac{0 \cdot x^n - 1 \cdot n x^{n-1}}{x^{2n}} = -\frac{n}{x^{n+1}}$.

b) $f_2'(x) = \frac{-\sin x \cdot \sin x - \cos x \cdot \cos x}{\sin^2 x} = -\frac{1}{\sin^2 x}$.

c) $f_3(x) = \exp(x \ln x)$. Kettenregel mit innerer Ableitung $(x \ln x)' = \ln x + 1$:

$$f_3'(x) = x^x\,(\ln x + 1).$$`,
    },
    {
      id: 'x2-sin',
      title: 'Differenzierbar, aber nicht stetig differenzierbar',
      source: 'Blatt 7, Aufgabe 4 b)',
      points: 7,
      task: r`Sei $f(x) = x^2 \sin\frac1x$ für $x \ne 0$ und $f(0) = 0$. Zeige, dass $f$ überall differenzierbar ist, berechne $f'$ und entscheide, ob $f$ zweimal differenzierbar ist.`,
      solution: r`**$x \ne 0$:** Produkt- und Kettenregel: $f'(x) = 2x \sin\frac1x + x^2 \cos\frac1x \cdot \left(-\frac{1}{x^2}\right) = 2x\sin\frac1x - \cos\frac1x$.

**$x = 0$:** $\left|\frac{f(x) - f(0)}{x - 0}\right| = \left|x \sin\frac1x\right| \le |x| \to 0$, also $f'(0) = 0$.

**Nicht zweimal differenzierbar in $0$:** Für $x_n = \frac{1}{2\pi n} \to 0$ ist $f'(x_n) = -1 \not\to 0 = f'(0)$. $f'$ ist in $0$ unstetig, also dort nicht differenzierbar.`,
    },
    {
      id: 'lhospital-rechnen',
      title: 'Grenzwerte mit l’Hospital',
      source: 'Blatt 7, Aufgabe 5',
      points: 5,
      task: r`a) Berechne $\lim_{x \to 1} \frac{x^2 - 1}{\ln x}$.
b) Wie muss $a$ gewählt werden, damit $F(x) = \frac{e^x - 1 - x}{x^2}$ für $x \ne 0$, $F(0) = a$ in $0$ stetig ist?`,
      solution: r`a) $f(x) = x^2 - 1$, $g(x) = \ln x$ mit $f(1) = g(1) = 0$, $g'(1) = 1 \ne 0$:

$$\lim_{x\to1} \frac{x^2 - 1}{\ln x} = \frac{f'(1)}{g'(1)} = \frac{2}{1} = 2.$$

b) Mit der Exponentialreihe: $\frac{e^x - 1 - x}{x^2} = \frac12 + \frac{x}{6} + \frac{x^2}{24} + \dots \to \frac12$ für $x \to 0$. Also $a = \frac12$. (Mit dieser Wahl ist $F$ durch eine Potenzreihe gegeben und sogar überall differenzierbar.)`,
    },
    {
      id: 'extrema-betrag-exp',
      title: 'Extrema klassifizieren',
      source: 'Blatt 8, Aufgabe 2',
      points: 7,
      task: r`Bestimme alle lokalen und globalen Extrema von $g(x) = |x|\,e^{-x^2}$. Liegen alle Extrema an kritischen Stellen?`,
      solution: r`$g$ ist gerade, $g \ge 0$ und $g(0) = 0$. Also ist $x = 0$ ein **globales Minimum**.

Für $x > 0$: $g(x) = x e^{-x^2}$, $g'(x) = e^{-x^2}(1 - 2x^2)$. $g'(x) = 0 \Leftrightarrow x = \frac{1}{\sqrt2}$; davor ist $g' > 0$, danach $g' < 0$, also lokales Maximum. Wegen $g(x) \to 0$ für $x \to \infty$ und der Symmetrie sind

$$x = \pm\frac{1}{\sqrt2} \quad \text{mit} \quad g\left(\pm\tfrac{1}{\sqrt2}\right) = \frac{1}{\sqrt{2e}} \approx 0{,}43$$

**globale Maxima**.

Nein: In $x = 0$ ist $g$ nicht differenzierbar (einseitige Ableitungen $\pm 1$), das Minimum liegt also nicht an einer kritischen Stelle.`,
    },
    {
      id: 'kurvendiskussion',
      title: 'Monotonie, Extrema und Konvexität',
      points: 6,
      task: r`Untersuche $f(x) = x^3 - 3x$ auf kritische Stellen, lokale Extrema, Monotonie und Konvexität.`,
      solution: r`$f'(x) = 3x^2 - 3 = 3(x - 1)(x + 1)$, kritische Stellen $x = \pm 1$. $f''(x) = 6x$.

- $f''(-1) = -6 < 0$: lokales Maximum, $f(-1) = 2$.
- $f''(1) = 6 > 0$: lokales Minimum, $f(1) = -2$.

Monotonie: $f' > 0$ für $|x| > 1$ (streng wachsend auf $]-\infty, -1]$ und $[1, \infty[$), $f' < 0$ für $|x| < 1$ (streng fallend auf $[-1, 1]$).

Konvexität: $f'' \ge 0 \Leftrightarrow x \ge 0$: konvex auf $[0, \infty[$, konkav auf $]-\infty, 0]$. Globale Extrema gibt es nicht ($f(x) \to \pm\infty$).`,
    },
    {
      id: 'newton-wurzel-2',
      title: 'Newtonverfahren für √2',
      points: 5,
      task: r`Führe für $f(x) = x^2 - 2$ mit Startwert $x_0 = 2$ drei Schritte des Newtonverfahrens durch. Warum konvergiert das Verfahren?`,
      solution: r`$x_{n+1} = x_n - \frac{x_n^2 - 2}{2x_n} = \frac12\left(x_n + \frac{2}{x_n}\right)$.

- $x_1 = \frac12(2 + 1) = \frac32 = 1{,}5$
- $x_2 = \frac12\left(\frac32 + \frac43\right) = \frac{17}{12} \approx 1{,}41667$
- $x_3 = \frac12\left(\frac{17}{12} + \frac{24}{17}\right) = \frac{577}{408} \approx 1{,}414216$

Konvergenz: Auf $[1, 2]$ ist $f$ zweimal differenzierbar und konvex ($f'' = 2 > 0$), $f(1) = -1 < 0$, $f(2) = 2 > 0$ und $f(x_0) \ge 0$. Nach Theorem 332 konvergiert die Folge monoton fallend gegen die einzige Nullstelle $\sqrt2$.`,
    },
    {
      id: 'mws-anwendung',
      title: 'Abschätzung mit dem Mittelwertsatz',
      points: 4,
      task: r`Zeige: Für alle $x, y \in \R$ gilt $|\sin x - \sin y| \le |x - y|$.`,
      solution: r`Für $x = y$ ist nichts zu zeigen. Sei o. B. d. A. $x < y$. $\sin$ ist auf $[x, y]$ stetig und differenzierbar, also gibt es nach dem Mittelwertsatz ein $c \in\, ]x, y[$ mit

$$\sin y - \sin x = \cos(c)\,(y - x).$$

Wegen $|\cos c| \le 1$ folgt $|\sin y - \sin x| \le |y - x|$.`,
    },
    {
      id: 'umkehrregel-arctan',
      title: 'Ableitung des Arcustangens',
      source: 'Blatt 8, Aufgabe 1 b)',
      points: 5,
      task: r`Zeige mit der Umkehrregel, dass $\arctan'(y) = \frac{1}{1 + y^2}$ für alle $y \in \R$ gilt.`,
      solution: r`Auf $\left]-\frac\pi2, \frac\pi2\right[$ ist $\tan'(x) = \frac{\cos^2 x + \sin^2 x}{\cos^2 x} = 1 + \tan^2 x \ge 1 > 0$. Also ist $\tan$ dort streng monoton wachsend, bildet das Intervall bijektiv auf $\R$ ab, und $\tan'(x) \ne 0$.

Für $y = \tan x$ liefert die Umkehrregel

$$\arctan'(y) = \frac{1}{\tan'(x)} = \frac{1}{1 + \tan^2 x} = \frac{1}{1 + y^2}.$$`,
    },
  ],
});
