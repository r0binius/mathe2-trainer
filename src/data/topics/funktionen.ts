import { topic } from '@/domain/content/build';

const r = String.raw;

/** Chapters 10.2 and 10.3 of the lecture notes: exp, ln and the trigonometric functions. */
export const funktionen = topic({
  id: 'funktionen',
  chapter: '10.2–10.3',
  title: 'Exponentialfunktion, Logarithmus, Trigonometrie',
  summary: 'exp und ln, Sinus und Cosinus über die Eulersche Identität, Polarkoordinaten.',
  definitions: [
    {
      id: 'exp',
      title: 'Exponentialfunktion',
      ref: 'Kapitel 10.2',
      statement: r`Die **Exponentialfunktion** ist definiert durch die für jedes $z \in \C$ absolut konvergente Potenzreihe

$$\exp : \C \to \C, \quad \exp(z) := \sum_{n=0}^{\infty} \frac{z^n}{n!}.$$`,
    },
    {
      id: 'eulersche-zahl',
      title: 'Eulersche Zahl',
      ref: 'Definition 246, Bemerkung 251',
      statement: r`Die Zahl $e := \exp(1) = \sum_{n=0}^\infty \frac{1}{n!}$ heißt **Eulersche Zahl**.

Für alle $z \in \C$ definiert man $e^z := \exp(z)$.`,
      note: r`$e \approx 2{,}71828$. Die Schreibweise $e^z$ ist gerechtfertigt, weil $\exp\left(\frac{p}{q}\right) = \sqrt[q]{e^p}$ für rationale Exponenten gilt.`,
    },
    {
      id: 'ln',
      title: 'Natürlicher Logarithmus',
      ref: 'Kapitel 10.2, vor Theorem 252',
      statement: r`Die reelle Exponentialfunktion ist streng monoton wachsend, also injektiv. Ihre **Umkehrfunktion** auf $J := \exp(\R) = \,]0, +\infty[$ heißt **natürlicher Logarithmus**:

$$\ln : J \to \R, \qquad \ln(\exp(x)) = x, \quad \exp(\ln(y)) = y.$$`,
    },
    {
      id: 'allgemeine-potenz',
      title: 'Allgemeine Potenz und q-te Wurzel',
      ref: 'Blatt 4, Aufgaben 1 und 2',
      statement: r`Für $x > 0$ und $\alpha \in \R$ ist die **allgemeine Potenz** definiert durch

$$x^\alpha := \exp(\alpha \ln x).$$

Für $q \in \N$ ist die **$q$-te Wurzel** $\sqrt[q]{x} := x^{\frac1q}$.`,
      note: r`Es gelten $x^{\alpha + \beta} = x^\alpha x^\beta$ und $x^{\alpha\beta} = (x^\alpha)^\beta$. Ableitung: $(x^\alpha)' = \alpha x^{\alpha - 1}$.`,
    },
    {
      id: 'sin-cos',
      title: 'Sinus und Cosinus',
      ref: 'Definition 254',
      statement: r`Die reellen Sinus- und Cosinusfunktionen sind definiert durch

$$\sin : \R \to [-1, 1],\ x \mapsto \operatorname{Im} e^{ix}, \qquad \cos : \R \to [-1, 1],\ x \mapsto \operatorname{Re} e^{ix}.$$`,
      note: r`$e^{ix}$ ist der Punkt auf dem Einheitskreis zum Winkel $x$ (Bogenmaß). Daraus folgt sofort die Eulersche Identität $e^{ix} = \cos x + i \sin x$.`,
    },
    {
      id: 'tangens',
      title: 'Tangens',
      ref: 'Definition 258',
      statement: r`$$\tan : \R \setminus \left\{\tfrac{\pi}{2} + k\pi \mid k \in \Z\right\} \to \R, \quad x \mapsto \frac{\sin x}{\cos x}$$

heißt **Tangensfunktion**.`,
      note: r`Nullstellen wie der Sinus ($\pi\Z$), Polstellen an den Nullstellen des Cosinus. Umkehrfunktion auf $\left]-\frac\pi2, \frac\pi2\right[$: $\arctan$.`,
    },
    {
      id: 'polarkoordinaten',
      title: 'Polarkoordinaten und Argument',
      ref: 'Kapitel 10.3.2, Formel (75)',
      statement: r`Jede komplexe Zahl $z \ne 0$ besitzt die **Polarkoordinatendarstellung**

$$z = |z|\, e^{ix}, \qquad x = \arg z.$$

Der Winkel $x$ (im Bogenmaß, gegen den Uhrzeigersinn von der positiven reellen Achse) heißt **Argument** von $z$; er ist nur bis auf Vielfache von $2\pi$ eindeutig.`,
      note: r`Multiplikation: $zw = |z||w|\,e^{i(x+y)}$ – Längen multiplizieren, Winkel addieren.`,
    },
    {
      id: 'einheitswurzeln',
      title: 'n-te Einheitswurzeln',
      ref: 'Blatt 5, Aufgabe 3',
      statement: r`Für $n \in \N$ heißen die Zahlen

$$\zeta_{n,k} := e^{i \frac{2\pi k}{n}}, \qquad k = 0, \dots, n - 1,$$

die **$n$-ten Einheitswurzeln**. Sie sind die $n$ paarweise verschiedenen Lösungen von $z^n - 1 = 0$.`,
      note: r`Sie bilden bezüglich der Multiplikation eine zyklische abelsche Gruppe $G_n$, erzeugt von $\zeta_{n,1}$.`,
    },
  ],
  theorems: [
    {
      id: 'funktionalgleichung-exp',
      title: 'Funktionalgleichung der Exponentialfunktion',
      ref: 'Theorem 245',
      statement: r`Für alle $z, w \in \C$ gilt

$$\exp(z + w) = \exp(z) \exp(w).$$`,
      note: r`Beweis mit dem Cauchy-Produkt und dem binomischen Lehrsatz.`,
    },
    {
      id: 'restglied-exp',
      title: 'Restgliedabschätzung der Exponentialreihe',
      ref: 'Theorem 247',
      statement: r`Für $N \in \N_0$ sei $r_{N+1}(z) := \sum_{n=0}^{\infty} \frac{z^n}{n!} - \sum_{n=0}^{N} \frac{z^n}{n!}$. Dann gilt für alle $z$ mit $|z| \le \frac{N+2}{2}$

$$|r_{N+1}(z)| \le \frac{2\,|z|^{N+1}}{(N+1)!}.$$`,
      note: r`Der Fehler nach Abbruch ist höchstens doppelt so groß wie der erste weggelassene Summand.`,
    },
    {
      id: 'eigenschaften-exp',
      title: 'Eigenschaften der Exponentialfunktion',
      ref: 'Theorem 250',
      statement: r`- $\exp(z) \ne 0$ für alle $z \in \C$
- $\exp(-z) = \dfrac{1}{\exp(z)}$
- $\exp(n) = e^n$ für alle $n \in \Z$
- $\exp(\overline{z}) = \overline{\exp(z)}$ für alle $z \in \C$
- $|\exp(ix)| = 1$ für alle $x \in \R$`,
    },
    {
      id: 'reelle-exp',
      title: 'Die reelle Exponentialfunktion',
      ref: 'Blatt 3, Aufgabe 2',
      statement: r`Für die reelle Exponentialfunktion gilt:

- $\exp(x) > 0$ für alle $x \in \R$,
- $\exp$ ist **streng monoton wachsend**: $x < y \Rightarrow \exp(x) < \exp(y)$,
- $\exp$ ist nicht nach oben beschränkt,
- $\exp\left(\frac{p}{q}\right) = \sqrt[q]{e^p}$ für $\frac{p}{q} \in \Q$,
- $\lim_{n \to \infty} \frac{\exp(x + h_n) - \exp(x)}{h_n} = \exp(x)$ für jede Nullfolge $(h_n)$ mit $h_n \ne 0$, d. h. $\exp' = \exp$.`,
    },
    {
      id: 'funktionalgleichung-ln',
      title: 'Funktionalgleichung und Rechenregeln des Logarithmus',
      ref: 'Theorem 252, Blatt 3 Aufgabe 3',
      statement: r`Für $x, y > 0$ und $n \in \N$ gilt:

- $\ln(xy) = \ln x + \ln y$
- $\ln\left(\frac{x}{y}\right) = \ln x - \ln y$
- $\ln(x^n) = n \ln x$
- $\ln 1 = 0$, $\ln e = 1$
- $\ln$ ist streng monoton wachsend, nach oben und unten unbeschränkt
- $\ln x \le x - 1$`,
    },
    {
      id: 'euler',
      title: 'Eulersche Identität und trigonometrischer Pythagoras',
      ref: 'Formeln (64), (65)',
      statement: r`Für alle $x \in \R$ gilt

$$e^{ix} = \cos x + i \sin x$$

und

$$\cos^2 x + \sin^2 x = 1.$$`,
      note: r`Die zweite Formel ist $|e^{ix}|^2 = 1$.`,
    },
    {
      id: 'potenzreihen-sin-cos',
      title: 'Potenzreihen von Sinus und Cosinus',
      ref: 'Theorem 255',
      statement: r`Auf ganz $\R$ absolut konvergent sind

$$\cos x = \sum_{n=0}^{\infty} (-1)^n \frac{x^{2n}}{(2n)!} \qquad \text{und} \qquad \sin x = \sum_{n=0}^{\infty} (-1)^n \frac{x^{2n+1}}{(2n+1)!}.$$`,
      note: r`Folge (Korollar 256): $\cos$ ist gerade, $\sin$ ungerade: $\cos(-x) = \cos x$, $\sin(-x) = -\sin x$.`,
    },
    {
      id: 'additionstheoreme',
      title: 'Additionstheoreme',
      ref: 'Theorem 257',
      statement: r`Für alle $x, y \in \R$ gilt

$$\cos(x + y) = \cos x \cos y - \sin x \sin y,$$

$$\sin(x + y) = \sin x \cos y + \cos x \sin y.$$`,
      note: r`Herleitung: Real- und Imaginärteil von $e^{i(x+y)} = e^{ix} e^{iy}$. Spezialfall: $\cos(2x) = \cos^2 x - \sin^2 x$, $\sin(2x) = 2 \sin x \cos x$.`,
    },
    {
      id: 'periodizitaet',
      title: 'Periodizität und Nullstellen',
      ref: 'Formeln (69)–(74), Übung 10.17',
      statement: r`Für alle $x \in \R$ gilt:

- $\sin(x + 2\pi) = \sin x$, $\cos(x + 2\pi) = \cos x$, $e^{i(x + 2\pi)} = e^{ix}$
- $\cos(x + \pi) = -\cos x$, $\sin(x + \pi) = -\sin x$
- $\cos x = \sin\left(\frac\pi2 - x\right)$, $\sin x = \cos\left(\frac\pi2 - x\right)$
- $\sin x = 0 \Leftrightarrow x \in \pi\Z$ und $\cos x = 0 \Leftrightarrow x \in \frac\pi2 + \pi\Z$
- $e^{ix} = 1 \Leftrightarrow x \in 2\pi\Z$`,
    },
    {
      id: 'wertetabelle',
      title: 'Wertetabelle von sin, cos und e^{ix}',
      ref: 'Tabelle (72), Übung 10.20',
      statement: r`$$\begin{array}{c|ccccc} x & 0 & \frac\pi6 & \frac\pi4 & \frac\pi3 & \frac\pi2 \\ \hline \sin x & 0 & \frac12 & \frac{\sqrt2}{2} & \frac{\sqrt3}{2} & 1 \\ \cos x & 1 & \frac{\sqrt3}{2} & \frac{\sqrt2}{2} & \frac12 & 0 \end{array}$$

Außerdem: $e^{i\pi/2} = i$, $e^{i\pi} = -1$, $e^{3i\pi/2} = -i$, $e^{2\pi i} = 1$.`,
      note: r`Merkhilfe für $\sin$: $\frac{\sqrt0}{2}, \frac{\sqrt1}{2}, \frac{\sqrt2}{2}, \frac{\sqrt3}{2}, \frac{\sqrt4}{2}$.`,
    },
  ],
  claims: [
    {
      id: 'exp-null',
      statement: r`Es gibt ein $z \in \C$ mit $\exp(z) = 0$.`,
      holds: false,
      reason: r`$\exp(z)\exp(-z) = \exp(0) = 1$, also $\exp(z) \ne 0$.`,
      ref: 'Theorem 250',
    },
    {
      id: 'exp-negativ',
      statement: r`Es gibt ein $z \in \C$ mit $\exp(z) = -1$.`,
      holds: true,
      reason: r`$e^{i\pi} = \cos\pi + i\sin\pi = -1$. (Für reelle $x$ ist dagegen stets $\exp(x) > 0$.)`,
    },
    {
      id: 'ln-summe',
      statement: r`Für alle $x, y > 0$ gilt $\ln(x + y) = \ln x + \ln y$.`,
      holds: false,
      reason: r`Richtig ist $\ln(xy) = \ln x + \ln y$. Gegenbeispiel: $\ln(1 + 1) = \ln 2 \ne 0 = \ln 1 + \ln 1$.`,
    },
    {
      id: 'cos-gerade',
      statement: r`$\cos$ ist eine gerade und $\sin$ eine ungerade Funktion.`,
      holds: true,
      reason: r`In der Cosinusreihe stehen nur gerade, in der Sinusreihe nur ungerade Potenzen (Korollar 256).`,
    },
    {
      id: 'sin-summe',
      statement: r`Für alle $x, y \in \R$ gilt $\sin(x + y) = \sin x + \sin y$.`,
      holds: false,
      reason: r`$\sin\left(\frac\pi2 + \frac\pi2\right) = 0 \ne 2$. Richtig: $\sin(x+y) = \sin x \cos y + \cos x \sin y$.`,
    },
    {
      id: 'betrag-eix',
      statement: r`Für alle $x \in \R$ liegt $e^{ix}$ auf dem Einheitskreis.`,
      holds: true,
      reason: r`$|e^{ix}|^2 = e^{ix}\,\overline{e^{ix}} = e^{ix} e^{-ix} = 1$.`,
    },
    {
      id: 'exp-periodisch',
      statement: r`Die komplexe Exponentialfunktion ist injektiv.`,
      holds: false,
      reason: r`$\exp(z + 2\pi i) = \exp(z)$ – sie ist $2\pi i$-periodisch. Nur die **reelle** Exponentialfunktion ist injektiv.`,
    },
    {
      id: 'arg-eindeutig',
      statement: r`Das Argument einer komplexen Zahl $z \ne 0$ ist eindeutig bestimmt.`,
      holds: false,
      reason: r`Nur bis auf Vielfache von $2\pi$. Eindeutig wird es erst nach Einschränkung auf ein Intervall der Länge $2\pi$.`,
    },
    {
      id: 'ln-ungleichung',
      statement: r`Für alle $x > 0$ gilt $\ln x \le x - 1$.`,
      holds: true,
      reason: r`Für alle $y \in \R$ gilt $e^{y} \ge 1 + y$. Mit $y = \ln x$ folgt $x \ge 1 + \ln x$.`,
      ref: 'Blatt 3, Aufgabe 3 e)',
    },
    {
      id: 'einheitswurzeln-summe',
      statement: r`Die dritten Einheitswurzeln sind $1$, $-\frac12 + \frac{\sqrt3}{2} i$ und $-\frac12 - \frac{\sqrt3}{2} i$.`,
      holds: true,
      reason: r`$e^{2\pi i k/3}$ für $k = 0, 1, 2$ mit $\cos\frac{2\pi}{3} = -\frac12$, $\sin\frac{2\pi}{3} = \frac{\sqrt3}{2}$.`,
    },
  ],
  problems: [
    {
      id: 'exp-positiv',
      title: 'exp ist positiv und streng monoton',
      source: 'Blatt 3, Aufgabe 2 a), b)',
      points: 6,
      task: r`Zeige: a) $\exp(x) > 0$ für alle $x \in \R$. b) Die reelle Exponentialfunktion ist streng monoton wachsend.`,
      hint: r`a) Schreibe $x = \frac{x}{2} + \frac{x}{2}$. b) Für $h > 0$ ist $\exp(h) > 1$ (Reihe ansehen).`,
      solution: r`a) Nach der Funktionalgleichung ist $\exp(x) = \exp\left(\frac x2\right)^2 \ge 0$, da $\exp\left(\frac x2\right)$ reell ist. Wegen $\exp(x) \ne 0$ (Theorem 250) folgt $\exp(x) > 0$.

b) Sei $x < y$, also $h := y - x > 0$. Dann ist $\exp(h) = 1 + h + \frac{h^2}{2} + \dots > 1$, da alle Summanden positiv sind. Mit a) folgt

$$\exp(y) = \exp(x)\exp(h) > \exp(x).$$`,
    },
    {
      id: 'e-naeherung',
      title: 'e auf drei Nachkommastellen',
      source: 'Theorem 247',
      points: 5,
      task: r`Wie viele Summanden der Exponentialreihe muss man mindestens addieren, damit die Restgliedabschätzung einen Fehler von höchstens $10^{-3}$ für $e = \exp(1)$ garantiert?`,
      solution: r`Für $z = 1$ gilt $|r_{N+1}(1)| \le \frac{2}{(N+1)!}$, sofern $1 \le \frac{N+2}{2}$ (stets erfüllt).

Gesucht ist das kleinste $N$ mit $\frac{2}{(N+1)!} \le 10^{-3}$, d. h. $(N+1)! \ge 2000$. Wegen $6! = 720 < 2000 \le 5040 = 7!$ ist $N = 6$.

Man braucht also die Summanden $n = 0, \dots, 6$ (sieben Stück): $\sum_{n=0}^{6} \frac{1}{n!} \approx 2{,}71806$, tatsächlicher Fehler ca. $2{,}3 \cdot 10^{-4}$.`,
    },
    {
      id: 'ln-regeln',
      title: 'Rechenregeln des Logarithmus beweisen',
      source: 'Blatt 3, Aufgabe 3 a)–c)',
      points: 5,
      task: r`Beweise mit der Funktionalgleichung $\ln(xy) = \ln x + \ln y$: a) $\ln 1 = 0$, $\ln e = 1$. b) $\ln(x^n) = n \ln x$ für $n \in \N$. c) $\ln\frac{x}{y} = \ln x - \ln y$.`,
      solution: r`a) $\exp(0) = 1$ und $\exp(1) = e$; Anwenden von $\ln = \exp^{-1}$ gibt $\ln 1 = 0$, $\ln e = 1$.

b) Induktion: $n = 1$ ist klar. $\ln(x^{n+1}) = \ln(x^n \cdot x) = \ln(x^n) + \ln x = n \ln x + \ln x = (n+1)\ln x$.

c) $\ln x = \ln\left(\frac{x}{y} \cdot y\right) = \ln\frac{x}{y} + \ln y$; Umstellen liefert die Behauptung.`,
    },
    {
      id: 'doppelwinkel',
      title: 'Doppelwinkelformeln und exakte Werte',
      source: 'Blatt 5, Aufgabe 1',
      points: 5,
      task: r`a) Zeige $\cos(2x) = \cos^2 x - \sin^2 x$ und $\sin(2x) = 2\sin x \cos x$.
b) Bestimme damit die exakten Werte von $\cos\frac\pi4$ und $\sin\frac\pi4$, und daraus $\sin\frac{3\pi}{4}$.`,
      solution: r`a) Additionstheoreme mit $y = x$: $\cos(x + x) = \cos x \cos x - \sin x \sin x$ und $\sin(x + x) = \sin x \cos x + \cos x \sin x$.

b) Mit $x = \frac\pi4$: $0 = \cos\frac\pi2 = \cos^2\frac\pi4 - \sin^2\frac\pi4$, also $\cos^2\frac\pi4 = \sin^2\frac\pi4$. Mit $\cos^2 + \sin^2 = 1$ folgt $\cos^2\frac\pi4 = \frac12$. Im ersten Quadranten sind beide Werte positiv:

$$\cos\frac\pi4 = \sin\frac\pi4 = \frac{\sqrt2}{2}.$$

$\sin\frac{3\pi}{4} = \sin\left(\frac\pi2 + \frac\pi4\right) = \sin\frac\pi2\cos\frac\pi4 + \cos\frac\pi2\sin\frac\pi4 = \frac{\sqrt2}{2}$.`,
    },
    {
      id: 'polarform',
      title: 'Potenz über Polarkoordinaten',
      points: 4,
      task: r`Schreibe $z = 1 + i$ in Polarkoordinaten und berechne damit $z^8$.`,
      solution: r`$|z| = \sqrt{1^2 + 1^2} = \sqrt2$ und $\arg z = \frac\pi4$ (wegen $\cos\frac\pi4 = \sin\frac\pi4 = \frac{1}{\sqrt2}$). Also $z = \sqrt2\, e^{i\pi/4}$.

$$z^8 = (\sqrt2)^8\, e^{i \cdot 8 \cdot \pi/4} = 16\, e^{2\pi i} = 16.$$`,
    },
    {
      id: 'einheitswurzeln-loesen',
      title: 'Einheitswurzeln sind Lösungen',
      source: 'Blatt 5, Aufgabe 3 a)',
      points: 5,
      task: r`Zeige, dass $\zeta_{n,k} = e^{i\frac{2\pi k}{n}}$ für $k = 0, \dots, n-1$ paarweise verschiedene Lösungen von $z^n - 1 = 0$ sind.`,
      solution: r`**Lösungen:** $\zeta_{n,k}^n = e^{i \cdot 2\pi k} = (e^{2\pi i})^k = 1$.

**Paarweise verschieden:** Sei $\zeta_{n,k} = \zeta_{n,l}$ mit $k, l \in \{0, \dots, n-1\}$. Dann ist $e^{i\frac{2\pi(k - l)}{n}} = 1$, also $\frac{2\pi(k-l)}{n} \in 2\pi\Z$, d. h. $n$ teilt $k - l$. Wegen $|k - l| \le n - 1$ folgt $k = l$.`,
    },
  ],
});
