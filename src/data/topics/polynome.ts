import { topic } from '@/domain/content/build';

const r = String.raw;

/** Chapter 10.1 of the lecture notes: polynomials, their zeros and Horner's scheme. */
export const polynome = topic({
  id: 'polynome',
  chapter: '10.1',
  title: 'Polynome und rationale Funktionen',
  summary: 'Grad, Nullstellen, Linearfaktoren und das Horner-Schema.',
  definitions: [
    {
      id: 'monom',
      title: 'Monom und sein Grad',
      ref: 'Definition 233 a), b)',
      statement: r`Seien $n \in \N$, $k_1, \dots, k_n \in \N_0$ und $\K \in \{\R, \C\}$. Eine Funktion der Form

$$m : \K^n \to \K,\quad (x_1, \dots, x_n) \mapsto x_1^{k_1} \cdot \ldots \cdot x_n^{k_n}$$

heißt **Monom** in den Variablen $x_1, \dots, x_n$. Die Zahl $\deg m := k_1 + \dots + k_n$ heißt **Grad** des Monoms.`,
    },
    {
      id: 'polynom',
      title: 'Polynom, Grad, K[x]',
      ref: 'Definition 233 c)–e)',
      statement: r`Eine **endliche Linearkombination von Monomen** mit Koeffizienten in $\K$ heißt **Polynom**. In einer Variablen:

$$p(x) = a_0 + a_1 x + \dots + a_n x^n.$$

Der **Grad** $\deg p$ ist der maximale Grad der in $p$ vorkommenden Monome; für das Nullpolynom setzt man $\deg(0) := -\infty$.

Die Menge aller Polynome mit Koeffizienten in $\K$ heißt $\K[x_1, \dots, x_n]$, für $n = 1$ kurz $\K[x]$.`,
    },
    {
      id: 'rationale-funktion',
      title: 'Rationale Funktion',
      ref: 'Definition 238',
      statement: r`Seien $p, q \in \K[x_1, \dots, x_n]$ und $N_q := q^{-1}(\{0\})$ die Nullstellenmenge von $q$. Eine Funktion

$$r : \K^n \setminus N_q \to \K,\quad x \mapsto \frac{p(x)}{q(x)}$$

heißt **(gebrochen-)rationale Funktion**.`,
    },
    {
      id: 'linearfaktor',
      title: 'Linearfaktor und Linearfaktorzerlegung',
      ref: 'nach Theorem 243',
      statement: r`Ist $c$ eine Nullstelle von $p \in \K[x]$, so heißt $x - c$ ein **Linearfaktor** von $p$. Eine Darstellung

$$p(x) = q(x) \prod_{j=1}^{k} (x - c_j)$$

mit einem Polynom $q$ ohne Nullstellen in $\K$ heißt **Linearfaktorzerlegung** von $p$ in $\K[x]$.`,
    },
  ],
  theorems: [
    {
      id: 'gradformel',
      title: 'Gradformeln',
      ref: 'Theorem 236, Blatt 2 Aufgabe 2 d)',
      statement: r`Für Polynome $p_1, p_2 \in \K[x]$ gilt

$$\deg(p_1 p_2) = \deg(p_1) + \deg(p_2)$$

und

$$\deg(p_1 + p_2) \le \max\{\deg(p_1), \deg(p_2)\}.$$`,
      note: r`Bei der Summe kann der Grad echt kleiner werden, wenn sich die Leitterme aufheben: $(x^2 + 1) + (-x^2) = 1$.`,
    },
    {
      id: 'division-mit-rest',
      title: 'Division durch einen Linearfaktor mit Rest',
      ref: 'Lemma 240',
      statement: r`Seien $p \in \K[x]$ mit $n := \deg p \ge 1$ und $c \in \K$ beliebig. Dann gibt es ein Polynom $q \in \K[x]$ vom Grad $0 \le \deg q \le n - 1$ und eine Zahl $b \in \K$ mit

$$p(x) = q(x)(x - c) + b.$$`,
      note: r`Einsetzen von $x = c$ zeigt: $b = p(c)$. Das Horner-Schema liefert $q$ und $b$ gleich mit.`,
    },
    {
      id: 'linearfaktorabspaltung',
      title: 'Linearfaktorabspaltung',
      ref: 'Theorem 242',
      statement: r`Sei $p \in \K[x]$ ein Polynom vom Grad $n \ge 1$ und $c$ eine **Nullstelle** von $p$. Dann gibt es ein Polynom $q \in \K[x]$ mit $0 \le \deg q < n$, sodass

$$p(x) = q(x)(x - c).$$`,
    },
    {
      id: 'linearfaktorzerlegung',
      title: 'Linearfaktorzerlegung',
      ref: 'Theorem 243',
      statement: r`Seien $1 \le k \le n$ und $p \in \K[x]$ ein Polynom vom Grad $n \ge 1$ mit Nullstellen $c_1, \dots, c_k$. Dann gibt es ein Polynom $q \in \K[x]$ **ohne Nullstellen in $\K$** mit

$$p(x) = q(x) \prod_{j=1}^{k} (x - c_j).$$`,
    },
    {
      id: 'anzahl-nullstellen',
      title: 'Höchstens n Nullstellen',
      ref: 'Blatt 2, Aufgabe 2 c)',
      statement: r`Ein Polynom $p \in \K[x]$ vom Grad $n \in \N$ hat **höchstens $n$ Nullstellen** in $\K$.`,
      note: r`Gilt nur in einer Variablen: $p(x, y) = x - y$ hat Grad $1$, aber unendlich viele Nullstellen $(t, t)$.`,
    },
    {
      id: 'horner',
      title: 'Horner-Schema',
      ref: 'Theorem 244',
      statement: r`Sei $p(x) = a_0 + a_1 x + \dots + a_n x^n$ ein Polynom vom Grad $n \ge 1$. Dann lässt sich $p(x)$ rekursiv berechnen durch

$$y_0 := a_n, \qquad y_k := y_{k-1}\, x + a_{n-k} \quad (k = 1, \dots, n).$$

Es ist $y_n = p(x)$, und die Berechnung benötigt $n$ Additionen und $n$ Multiplikationen, also $2n$ Rechenoperationen.`,
      note: r`Idee: $p(x) = (\dots((a_n x + a_{n-1})x + a_{n-2})x + \dots)x + a_0$. Das naive Auswerten braucht dagegen ca. $\frac{n(n+1)}{2}$ Multiplikationen.`,
    },
  ],
  claims: [
    {
      id: 'grad-summe',
      statement: r`Für alle $p, q \in \K[x]$ gilt $\deg(p + q) = \max\{\deg p, \deg q\}$.`,
      holds: false,
      reason: r`Nur $\le$: $p = x^2 + 1$, $q = -x^2$ ergibt $p + q = 1$ vom Grad $0$.`,
    },
    {
      id: 'grad-produkt',
      statement: r`Für alle $p, q \in \K[x]$ gilt $\deg(pq) = \deg p + \deg q$.`,
      holds: true,
      reason: r`Theorem 236 (mit der Konvention $\deg 0 = -\infty$ auch für das Nullpolynom).`,
    },
    {
      id: 'reelle-nullstelle',
      statement: r`Jedes Polynom in $\R[x]$ vom Grad $\ge 1$ hat eine reelle Nullstelle.`,
      holds: false,
      reason: r`$x^2 + 1$ hat keine reelle Nullstelle (in $\C$ aber $\pm i$).`,
    },
    {
      id: 'ungerader-grad',
      statement: r`Jedes Polynom in $\R[x]$ von ungeradem Grad hat eine reelle Nullstelle.`,
      holds: true,
      reason: r`Für $x \to \pm\infty$ hat $p$ verschiedene Vorzeichen; da $p$ stetig ist, liefert der Zwischenwertsatz eine Nullstelle.`,
    },
    {
      id: 'horner-aufwand',
      statement: r`Das Horner-Schema wertet ein Polynom vom Grad $n$ mit $n$ Multiplikationen und $n$ Additionen aus.`,
      holds: true,
      reason: r`Theorem 244: insgesamt $2n$ Rechenoperationen.`,
    },
    {
      id: 'rest-ist-wert',
      statement: r`Teilt man $p(x)$ mit Rest durch $(x - c)$, so ist der Rest gleich $p(c)$.`,
      holds: true,
      reason: r`Aus $p(x) = q(x)(x - c) + b$ folgt durch Einsetzen $p(c) = b$.`,
    },
    {
      id: 'vier-nullstellen',
      statement: r`Ein Polynom vom Grad $3$ in $\C[x]$ kann vier verschiedene Nullstellen haben.`,
      holds: false,
      reason: r`Ein Polynom vom Grad $n$ hat höchstens $n$ Nullstellen.`,
    },
    {
      id: 'zwei-variablen',
      statement: r`Auch ein Polynom vom Grad $1$ in zwei Variablen hat höchstens eine Nullstelle.`,
      holds: false,
      reason: r`$p(x, y) = x - y$ verschwindet auf der ganzen Diagonale $\{(t,t)\}$.`,
    },
  ],
  problems: [
    {
      id: 'x5-plus-1',
      title: 'Linearfaktor abspalten',
      source: 'Blatt 2, Aufgabe 2 a)',
      points: 4,
      task: r`Sei $p(x) := x^5 + 1$. Bestimme eine reelle Nullstelle $c$ und stelle $p$ in der Form $p(x) = q(x)(x - c)$ mit einem Polynom $q$ vom Grad $4$ dar.`,
      solution: r`$p(-1) = -1 + 1 = 0$, also $c = -1$. Polynomdivision (oder Horner-Schema mit $x = -1$) ergibt

$$x^5 + 1 = (x^4 - x^3 + x^2 - x + 1)(x + 1).$$

Probe: Ausmultiplizieren liefert $x^5 - x^4 + x^3 - x^2 + x + x^4 - x^3 + x^2 - x + 1 = x^5 + 1$.`,
    },
    {
      id: 'zerlegung-komplex',
      title: 'Linearfaktorzerlegung in ℂ[x]',
      source: 'Blatt 2, Aufgabe 2 b)',
      points: 4,
      task: r`Bestimme die Linearfaktorzerlegung von $p(x) := x^3 - x^2 + x - 1$ in $\C[x]$.`,
      hint: r`Rate eine Nullstelle oder klammere geschickt aus.`,
      solution: r`$p(x) = x^2(x - 1) + (x - 1) = (x - 1)(x^2 + 1)$.

$x^2 + 1$ hat in $\C$ die Nullstellen $\pm i$, also

$$p(x) = (x - 1)(x - i)(x + i).$$

(In $\R[x]$ wäre $(x-1)(x^2+1)$ bereits die Zerlegung, da $x^2 + 1$ keine reellen Nullstellen hat.)`,
    },
    {
      id: 'horner-rechnen',
      title: 'Horner-Schema rechnen',
      source: 'Blatt 3, Aufgabe 1',
      points: 4,
      task: r`Werte $p(x) := 2x^3 + 3x^2 + 5x + 4$ an der Stelle $x = 2$ mit dem Horner-Schema aus.`,
      solution: r`Koeffizienten $a_3 = 2,\ a_2 = 3,\ a_1 = 5,\ a_0 = 4$:

- $y_0 = 2$
- $y_1 = 2 \cdot 2 + 3 = 7$
- $y_2 = 7 \cdot 2 + 5 = 19$
- $y_3 = 19 \cdot 2 + 4 = 42$

Also $p(2) = 42$ – mit $3$ Multiplikationen und $3$ Additionen.`,
    },
    {
      id: 'kubisch-zerlegen',
      title: 'Kubisches Polynom vollständig zerlegen',
      points: 5,
      task: r`Zerlege $p(x) = x^3 - 6x^2 + 11x - 6$ in Linearfaktoren.`,
      solution: r`$p(1) = 1 - 6 + 11 - 6 = 0$. Horner-Schema mit $x = 1$: $1,\ -5,\ 6,\ 0$, also $p(x) = (x - 1)(x^2 - 5x + 6)$.

$x^2 - 5x + 6 = (x - 2)(x - 3)$. Damit

$$p(x) = (x - 1)(x - 2)(x - 3).$$`,
    },
    {
      id: 'hoechstens-n',
      title: 'Höchstens n Nullstellen',
      source: 'Blatt 2, Aufgabe 2 c)',
      points: 6,
      task: r`Sei $p \in \K[x]$ mit $\deg p = n \in \N$. Zeige, dass $p$ höchstens $n$ Nullstellen in $\K$ hat. Gib ein Beispiel, dass dies für Polynome in mehreren Variablen falsch ist.`,
      solution: r`Angenommen, $p$ hätte $n + 1$ verschiedene Nullstellen $c_1, \dots, c_{n+1}$. Nach dem Satz über die Linearfaktorzerlegung ist dann $p(x) = q(x) \prod_{j=1}^{n+1} (x - c_j)$ mit $q \ne 0$ (da $p \ne 0$). Mit der Gradformel folgt

$$n = \deg p = \deg q + (n + 1) \ge n + 1,$$

ein Widerspruch.

Gegenbeispiel in zwei Variablen: $p(x, y) = xy$ (oder $x - y$) hat unendlich viele Nullstellen, z. B. alle $(0, t)$.`,
    },
  ],
});
