import { topic } from '@/domain/content/build';

const r = String.raw;

/** Chapter 13 of the lecture notes: the integral of regulated functions and how to compute it. */
export const integralrechnung = topic({
  id: 'integralrechnung',
  chapter: '13',
  title: 'Integralrechnung',
  summary:
    'Regelfunktionen, Hauptsatz, partielle Integration, Substitution, Taylor und uneigentliche Integrale.',
  definitions: [
    {
      id: 'treppenfunktion',
      title: 'Treppenfunktion',
      ref: 'Definition 335',
      statement: r`Eine Funktion $\tau : [a, b] \to \R$ heißt **Treppenfunktion**, wenn es ein $n \in \N$, eine Einteilung $a = x_0 < x_1 < \dots < x_n = b$ und Konstanten $c_0, \dots, c_{n-1} \in \R$ gibt mit

$$\tau|_{[x_k, x_{k+1}[} = c_k \quad \text{für } k = 0, \dots, n-1,$$

d. h. $\tau$ ist abschnittsweise konstant. Die Menge aller Treppenfunktionen auf $[a,b]$ heißt $T([a, b])$.`,
    },
    {
      id: 'elementarintegral',
      title: 'Elementarintegral',
      ref: 'Definition 337',
      statement: r`Sei $\tau \in T([a,b])$ mit zugehöriger Zerlegung $x_0 < \dots < x_n$ und $\Delta_k := x_{k+1} - x_k$. Das **Elementarintegral** von $\tau$ ist

$$I(\tau) := \sum_{k=0}^{n-1} \tau(x_k)\,\Delta_k.$$

Schreibweisen: $\int_a^b \tau$ und $\int_a^b \tau(x)\,dx$.`,
      note: r`Summe der (vorzeichenbehafteten) Rechteckflächen „Höhe mal Breite“.`,
    },
    {
      id: 'supremumsnorm',
      title: 'Supremumsnorm',
      ref: 'Definition 342',
      statement: r`Seien $X \ne \emptyset$ und $f : X \to \R$ **beschränkt**, d. h. es gebe $M > 0$ mit $|f(x)| \le M$ für alle $x \in X$. Dann heißt

$$\|f\|_\infty := \sup_{x \in X} |f(x)|$$

**Supremumsnorm** von $f$.`,
    },
    {
      id: 'regelfunktion',
      title: 'Regelfunktion und ihr Integral',
      ref: 'Definition 345',
      statement: r`Eine Funktion $f : [a, b] \to \R$ heißt **Regelfunktion**, wenn es eine Folge $(\tau_n)$ von Treppenfunktionen in $T([a,b])$ gibt mit

$$\lim_{n \to \infty} \|f - \tau_n\|_\infty = 0.$$

Die Menge aller Regelfunktionen heißt $R([a,b])$. Das **Integral** von $f \in R([a,b])$ ist

$$\int_a^b f(x)\,dx := I(f) := \lim_{n \to \infty} I(\tau_n).$$`,
      note: r`Regelfunktionen sind genau die Funktionen, die sich **gleichmäßig** durch Treppenfunktionen annähern lassen.`,
    },
    {
      id: 'unbestimmtes-integral',
      title: 'Unbestimmtes Integral',
      ref: 'nach Theorem 354',
      statement: r`Eine Stammfunktion $F$ von $f$ nennt man auch **unbestimmtes Integral** von $f$ und schreibt

$$\int f(x)\,dx = F(x) + c.$$`,
      note: r`Wichtige Stammfunktionen: $\int x^n dx = \frac{x^{n+1}}{n+1}$ ($n \ne -1$), $\int \frac1x dx = \ln|x|$, $\int e^x dx = e^x$, $\int \sin = -\cos$, $\int \cos = \sin$, $\int \frac{1}{1+x^2}dx = \arctan x$.`,
    },
    {
      id: 'trigonometrisches-polynom',
      title: 'Trigonometrisches Polynom',
      ref: 'Definition 365',
      statement: r`Seien $n \in \N$ und $a_0, \dots, a_n, b_1, \dots, b_n \in \R$. Eine Funktion der Form

$$f(x) := \frac{a_0}{2} + \sum_{k=1}^{n} \bigl(a_k \sin kx + b_k \cos kx\bigr)$$

heißt **trigonometrisches Polynom der Ordnung $n$**.`,
      note: r`Achtung: Im Skript gehören die $a_k$ zum **Sinus** und die $b_k$ zum **Cosinus** – in vielen Büchern ist es umgekehrt.`,
    },
    {
      id: 'restglied-integral',
      title: 'Restglied der Taylorformel (Integralform)',
      ref: 'Theorem 372',
      statement: r`Für eine $(n+1)$-mal stetig differenzierbare Funktion $f : J \to \R$ und $a \in J$ ist das **$(n+1)$-te Restglied**

$$R_{n+1}(f; a)(x) := \frac{1}{n!} \int_a^x (x - t)^n f^{(n+1)}(t)\,dt.$$`,
    },
    {
      id: 'uneigentlich-rand',
      title: 'Uneigentliches Integral bei kritischer Grenze',
      ref: 'Definition 378',
      statement: r`Sei $f : \,]a, b] \to \R$ für jedes $\varepsilon \in\, ]0, b - a[$ über $[a + \varepsilon, b]$ integrierbar. Existiert der Grenzwert, so heißt das Integral

$$\int_a^b f(x)\,dx := \lim_{\varepsilon \to 0+} \int_{a + \varepsilon}^{b} f(x)\,dx$$

**konvergent**. Analog bei kritischer oberer Grenze.`,
    },
    {
      id: 'uneigentlich-unendlich',
      title: 'Uneigentliches Integral über unbeschränkte Intervalle',
      ref: 'Definitionen 380, 382',
      statement: r`Sei $f : [a, \infty[\, \to \R$ für jedes $R > a$ über $[a, R]$ integrierbar. Existiert der Grenzwert, so heißt

$$\int_a^\infty f(x)\,dx := \lim_{R \to \infty} \int_a^R f(x)\,dx$$

**konvergent**; analog $\int_{-\infty}^b$. Sind **beide** Grenzen kritisch, wählt man ein $c \in\, ]a,b[$ und verlangt, dass beide Teilintegrale konvergieren:

$$\int_a^b f(x)\,dx := \lim_{\alpha \to a} \int_\alpha^c f(x)\,dx + \lim_{\beta \to b} \int_c^\beta f(x)\,dx.$$`,
    },
  ],
  theorems: [
    {
      id: 'elementarintegral-eigenschaften',
      title: 'Eigenschaften des Elementarintegrals',
      ref: 'Theorem 344',
      statement: r`- Das Elementarintegral $I : T([a,b]) \to \R$ ist eine **positive Linearform**: $I$ ist linear, und aus $\tau \ge 0$ folgt $I(\tau) \ge 0$.
- Für jedes $\tau \in T([a,b])$ gilt $|I(\tau)| \le (b - a)\,\|\tau\|_\infty$.`,
    },
    {
      id: 'stetig-regelfunktion',
      title: 'Stetige Funktionen sind Regelfunktionen',
      ref: 'Theorem 348',
      statement: r`Jede **stetige** Funktion $f : [a, b] \to \R$ ist eine Regelfunktion – also integrierbar.`,
    },
    {
      id: 'integral-eigenschaften',
      title: 'Eigenschaften des Integrals',
      ref: 'Theorem 349',
      statement: r`- $R([a,b])$ ist ein reeller Vektorraum, und das Integral $\int_a^b : R([a,b]) \to \R$ ist eine **positive Linearform** (linear, und $f \ge 0 \Rightarrow \int_a^b f \ge 0$).
- Jede Regelfunktion $f$ ist beschränkt, und es gilt

$$\left|\int_a^b f(x)\,dx\right| \le \|f\|_\infty\,(b - a).$$`,
      note: r`Positivität ist äquivalent zur **Monotonie**: $f \le g \Rightarrow \int_a^b f \le \int_a^b g$.`,
    },
    {
      id: 'intervalladditivitaet',
      title: 'Intervalladditivität',
      ref: 'Theorem 350',
      statement: r`Seien $a < c < b$ und $f : [a,b] \to \R$ eine Regelfunktion. Dann ist

$$\int_a^b f = \int_a^c f + \int_c^b f.$$`,
    },
    {
      id: 'standardabschaetzung',
      title: 'Standardabschätzung für Integrale',
      ref: 'Formel (89)',
      statement: r`Mit $m := \inf_{x \in [a,b]} f(x)$ und $M := \sup_{x \in [a,b]} f(x)$ gilt

$$m\,(b - a) \le \int_a^b f \le M\,(b - a).$$`,
    },
    {
      id: 'mittelwertsatz-integral',
      title: 'Mittelwertsatz der Integralrechnung',
      ref: 'Theorem 352',
      statement: r`Seien $f, \varphi : [a, b] \to \R$ stetig und $\varphi \ge 0$ auf $[a, b]$. Dann gibt es ein $\xi \in [a, b]$ mit

$$\int_a^b f(t)\,\varphi(t)\,dt = f(\xi) \int_a^b \varphi(t)\,dt.$$

Im Spezialfall $\varphi = 1$: $\int_a^b f(t)\,dt = f(\xi)\,(b - a)$.`,
    },
    {
      id: 'hauptsatz-1',
      title: 'Hauptsatz der Differenzial- und Integralrechnung, 1. Version',
      ref: 'Theorem 353',
      statement: r`Sei $f : [a, b] \to \R$ **stetig** und

$$F : [a,b] \to \R,\quad F(x) := \int_a^x f(t)\,dt.$$

Dann ist $F$ differenzierbar und eine Stammfunktion von $f$, d. h. $F' = f$.`,
      note: r`Jede stetige Funktion hat also eine Stammfunktion; Integrieren und Differenzieren sind Umkehroperationen.`,
    },
    {
      id: 'hauptsatz-2',
      title: 'Hauptsatz der Differenzial- und Integralrechnung, 2. Version',
      ref: 'Theorem 354',
      statement: r`Seien $f : [a, b] \to \R$ **stetig** und $F$ eine Stammfunktion von $f$. Dann gilt

$$\int_a^b f(x)\,dx = F(x)\Big|_a^b := F(b) - F(a).$$`,
    },
    {
      id: 'partielle-integration',
      title: 'Partielle Integration',
      ref: 'Theorem 356',
      statement: r`Seien $u, v : [a, b] \to \R$ **stetig differenzierbar**. Dann gilt

$$\int_a^b u'(x)\,v(x)\,dx = u(x)\,v(x)\Big|_a^b - \int_a^b u(x)\,v'(x)\,dx.$$`,
      note: r`Das ist die integrierte Produktregel. Faustregel: $v$ so wählen, dass $v'$ einfacher wird (Polynome, $\ln$).`,
    },
    {
      id: 'substitutionsregel',
      title: 'Substitutionsregel',
      ref: 'Theorem 359',
      statement: r`Seien $I \subset \R$ ein Intervall, $f : I \to \R$ **stetig** und $\varphi : [a, b] \to I$ **stetig differenzierbar**. Dann gilt

$$\int_a^b f(\varphi(t))\,\varphi'(t)\,dt = \int_{\varphi(a)}^{\varphi(b)} f(x)\,dx.$$`,
      note: r`Das ist die integrierte Kettenregel. Merkhilfe: $x = \varphi(t)$, $dx = \varphi'(t)\,dt$ – und die **Grenzen mitsubstituieren**.`,
    },
    {
      id: 'substitution-spezial',
      title: 'Spezialfälle der Substitutionsregel',
      ref: 'Theorem 363',
      statement: r`- Für $c \in \R$: $\displaystyle\int_a^b f(t + c)\,dt = \int_{a+c}^{b+c} f(x)\,dx$
- Für $c \ne 0$: $\displaystyle\int_a^b f(ct)\,dt = \frac1c \int_{ac}^{bc} f(x)\,dx$
- $\displaystyle\int_a^b t\,f(t^2)\,dt = \frac12 \int_{a^2}^{b^2} f(x)\,dx$`,
    },
    {
      id: 'fourier-koeffizienten',
      title: 'Koeffizienten eines trigonometrischen Polynoms',
      ref: 'Theorem 366',
      statement: r`Sei $f(x) = \frac{a_0}{2} + \sum_{k=1}^{n} (a_k \sin kx + b_k \cos kx)$. Dann gilt für $k = 1, \dots, n$

$$a_k = \frac1\pi \int_0^{2\pi} f(x) \sin(kx)\,dx, \qquad b_k = \frac1\pi \int_0^{2\pi} f(x) \cos(kx)\,dx,$$

und $a_0 = \frac1\pi \int_0^{2\pi} f(x)\,dx$.`,
      note: r`Dahinter stehen die Orthogonalitätsrelationen, z. B. $\int_0^{2\pi} \sin(kx)\sin(lx)\,dx = \pi$ für $k = l \ge 1$ und $0$ für $k \ne l$.`,
    },
    {
      id: 'taylor-formel',
      title: 'Taylorsche Formel',
      ref: 'Theorem 372',
      statement: r`Seien $J \subset \R$ ein Intervall, $a \in J$, $n \in \N_0$ und $f : J \to \R$ $(n+1)$-mal stetig differenzierbar. Dann gilt

$$f(x) = T_n(f; a)(x) + R_{n+1}(f; a)(x)$$

mit $T_n(f;a)(x) = \sum_{k=0}^{n} \frac{f^{(k)}(a)}{k!}(x-a)^k$ und $R_{n+1}(f;a)(x) = \frac{1}{n!}\int_a^x (x - t)^n f^{(n+1)}(t)\,dt$.`,
    },
    {
      id: 'lagrange-restglied',
      title: 'Lagrange-Darstellung und Abschätzung des Restglieds',
      ref: 'Theorem 374, Korollar 375',
      statement: r`Unter den Voraussetzungen der Taylorschen Formel gibt es ein $\xi$ zwischen $a$ und $x$ mit

$$R_{n+1}(f; a)(x) = \frac{f^{(n+1)}(\xi)}{(n+1)!}\,(x - a)^{n+1}.$$

Daraus folgt die Abschätzung

$$|R_{n+1}(f; a)(x)| \le \frac{1}{(n+1)!}\, \sup_{\xi \in [a, x]} \bigl|f^{(n+1)}(\xi)\bigr|\; |x - a|^{n+1}.$$`,
    },
    {
      id: 'uneigentlich-potenzen',
      title: 'Uneigentliche Integrale von Potenzen',
      ref: 'Beispiele in Kapitel 13.3.3',
      statement: r`- $\displaystyle\int_0^1 \frac{dx}{x^s}$ konvergiert für $s < 1$, mit Wert $\dfrac{1}{1 - s}$.
- $\displaystyle\int_1^\infty \frac{dx}{x^s}$ konvergiert für $s > 1$, mit Wert $\dfrac{1}{s - 1}$.`,
      note: r`Für $s = 1$ divergieren beide ($\ln$ ist unbeschränkt). Merke: Bei $0$ hilft ein **kleiner** Exponent, bei $\infty$ ein **großer**.`,
    },
  ],
  claims: [
    {
      id: 'stetig-integrierbar',
      statement: r`Jede stetige Funktion $f : [a,b] \to \R$ ist integrierbar.`,
      holds: true,
      reason: r`Stetige Funktionen sind Regelfunktionen (Theorem 348).`,
    },
    {
      id: 'stammfunktion-eindeutig',
      statement: r`Eine stetige Funktion hat genau eine Stammfunktion.`,
      holds: false,
      reason: r`Mit $F$ ist auch $F + c$ eine Stammfunktion. Eindeutig ist sie nur bis auf eine additive Konstante.`,
    },
    {
      id: 'integral-produkt',
      statement: r`Für stetige $f, g$ gilt $\int_a^b f g = \int_a^b f \cdot \int_a^b g$.`,
      holds: false,
      reason: r`$f = g = 1$ auf $[0, 2]$: links $2$, rechts $4$. Für Produkte gibt es die partielle Integration.`,
    },
    {
      id: 'hauptsatz-ableitung',
      statement: r`$\frac{d}{dx} \int_0^x e^{-t^2}\,dt = e^{-x^2}$`,
      holds: true,
      reason: r`Hauptsatz, 1. Version: Die Integralfunktion einer stetigen Funktion ist eine Stammfunktion.`,
    },
    {
      id: 'eins-durch-x',
      statement: r`Das uneigentliche Integral $\int_1^\infty \frac{1}{x}\,dx$ konvergiert.`,
      holds: false,
      reason: r`$\int_1^R \frac1x dx = \ln R \to \infty$. Konvergenz von $\int_1^\infty x^{-s}dx$ nur für $s > 1$.`,
    },
    {
      id: 'eins-durch-wurzel',
      statement: r`$\int_0^1 \frac{1}{\sqrt{x}}\,dx = 2$`,
      holds: true,
      reason: r`$\int_\varepsilon^1 x^{-1/2}dx = 2(1 - \sqrt\varepsilon) \to 2$ für $\varepsilon \to 0+$.`,
      ref: 'Beispiel 377',
    },
    {
      id: 'positiv-integral',
      statement: r`Ist $\int_a^b f(x)\,dx \ge 0$, so ist $f(x) \ge 0$ für alle $x \in [a,b]$.`,
      holds: false,
      reason: r`Die Umkehrung der Positivität gilt nicht: $\int_{-1}^{2} x\,dx = \frac32 > 0$, aber $f(-1) < 0$.`,
    },
    {
      id: 'stammfunktion-diffbar',
      statement: r`Jede Stammfunktion ist differenzierbar.`,
      holds: true,
      reason: r`Das steht in der Definition: $F$ ist differenzierbar mit $F' = f$. Nicht differenzierbare Stammfunktionen gibt es nicht.`,
      ref: 'Blatt 8, Aufgabe 3 d)',
    },
    {
      id: 'substitution-grenzen',
      statement: r`$\int_0^2 2t\,e^{t^2}\,dt = \int_0^2 e^x\,dx$`,
      holds: false,
      reason: r`Mit $x = t^2$ werden die Grenzen zu $0$ und $4$: $\int_0^4 e^x dx = e^4 - 1$.`,
    },
    {
      id: 'orthogonal',
      statement: r`$\int_0^{2\pi} \sin(x)\cos(x)\,dx = 0$`,
      holds: true,
      reason: r`$\sin x \cos x = \frac12 \sin 2x$, und $\int_0^{2\pi} \sin 2x\,dx = 0$.`,
    },
    {
      id: 'treppen-regel',
      statement: r`Jede Treppenfunktion ist eine Regelfunktion.`,
      holds: true,
      reason: r`Wähle die konstante Folge $\tau_n := \tau$; dann ist $\|\tau - \tau_n\|_\infty = 0$.`,
    },
  ],
  problems: [
    {
      id: 'bestimmtes-integral',
      title: 'Bestimmtes Integral mit dem Hauptsatz',
      points: 3,
      task: r`Berechne $\int_0^2 (3x^2 - 2x + 1)\,dx$.`,
      solution: r`Eine Stammfunktion ist $F(x) = x^3 - x^2 + x$. Nach dem Hauptsatz:

$$\int_0^2 (3x^2 - 2x + 1)\,dx = F(2) - F(0) = 8 - 4 + 2 = 6.$$`,
    },
    {
      id: 'stammfunktion-xex',
      title: 'Stammfunktion mit Anfangswert',
      source: 'Blatt 8, Aufgabe 3 a), b)',
      points: 5,
      task: r`a) Sei $f = u'v + uv'$ für differenzierbare $u, v$. Bestimme eine Stammfunktion von $f$.
b) Bestimme damit eine Stammfunktion $F$ von $f(x) = x e^x$ mit $F(0) = 42$.`,
      solution: r`a) Nach der Produktregel ist $(uv)' = u'v + uv'$, also ist $F = uv$ eine Stammfunktion.

b) Mit $u = x$, $v = e^x$: $(x e^x)' = e^x + x e^x$, also $x e^x = (x e^x)' - e^x = \bigl((x - 1)e^x\bigr)'$.

Alle Stammfunktionen: $F(x) = (x - 1)e^x + c$. Aus $F(0) = -1 + c = 42$ folgt $c = 43$:

$$F(x) = (x - 1)\,e^x + 43.$$`,
    },
    {
      id: 'stammfunktion-ln',
      title: 'Stammfunktion des Logarithmus',
      source: 'Blatt 8, Aufgabe 3 c)',
      points: 4,
      task: r`Bestimme eine Stammfunktion von $g(x) = \ln x$ auf $]0, \infty[$.`,
      hint: r`Schreibe $\ln x = 1 \cdot \ln x$ und integriere partiell.`,
      solution: r`Partielle Integration mit $u'(x) = 1$, $v(x) = \ln x$, also $u(x) = x$, $v'(x) = \frac1x$:

$$\int \ln x\,dx = x \ln x - \int x \cdot \frac1x\,dx = x \ln x - x + c.$$

Probe: $(x \ln x - x)' = \ln x + 1 - 1 = \ln x$.`,
    },
    {
      id: 'partiell-x-sin',
      title: 'Partielle Integration',
      points: 4,
      task: r`Berechne $\int_0^\pi x \sin x\,dx$.`,
      solution: r`$u'(x) = \sin x$, $v(x) = x$, also $u(x) = -\cos x$, $v'(x) = 1$:

$$\int_0^\pi x \sin x\,dx = \bigl[-x \cos x\bigr]_0^\pi + \int_0^\pi \cos x\,dx = \pi + \bigl[\sin x\bigr]_0^\pi = \pi.$$`,
    },
    {
      id: 'substitution-rechnen',
      title: 'Substitution',
      points: 5,
      task: r`Berechne

a) $\int_0^1 2t\,e^{t^2}\,dt$
b) $\int_0^{\pi/2} \sin^2 t \cos t\,dt$`,
      solution: r`a) $\varphi(t) = t^2$, $\varphi'(t) = 2t$, Grenzen $0 \mapsto 0$, $1 \mapsto 1$:

$$\int_0^1 e^{t^2} \cdot 2t\,dt = \int_0^1 e^x\,dx = e - 1.$$

b) $\varphi(t) = \sin t$, $\varphi'(t) = \cos t$, Grenzen $0 \mapsto 0$, $\frac\pi2 \mapsto 1$:

$$\int_0^{\pi/2} \sin^2 t \cos t\,dt = \int_0^1 x^2\,dx = \frac13.$$`,
    },
    {
      id: 'uneigentlich-rechnen',
      title: 'Uneigentliche Integrale',
      points: 5,
      task: r`Untersuche auf Konvergenz und berechne ggf. den Wert:

a) $\int_1^\infty \frac{1}{x^2}\,dx$
b) $\int_0^\infty e^{-x}\,dx$
c) $\int_0^1 \frac1x\,dx$`,
      solution: r`a) $\int_1^R x^{-2}dx = \left[-\frac1x\right]_1^R = 1 - \frac1R \to 1$. Konvergent mit Wert $1$.

b) $\int_0^R e^{-x}dx = 1 - e^{-R} \to 1$. Konvergent mit Wert $1$.

c) $\int_\varepsilon^1 \frac1x dx = -\ln\varepsilon \to +\infty$ für $\varepsilon \to 0+$. Divergent.`,
    },
    {
      id: 'taylor-exp',
      title: 'Taylorpolynom mit Fehlerabschätzung',
      points: 6,
      task: r`Bestimme das Taylorpolynom $T_2(\exp; 0)$ und schätze den Fehler bei der Näherung von $e^{0{,}1}$ ab.`,
      solution: r`Alle Ableitungen von $\exp$ sind $\exp$, mit Wert $1$ in $0$:

$$T_2(\exp; 0)(x) = 1 + x + \frac{x^2}{2}, \qquad T_2(0{,}1) = 1{,}105.$$

Restgliedabschätzung mit $n = 2$: $|R_3(0{,}1)| \le \frac{1}{3!} \sup_{\xi \in [0;\,0{,}1]} e^\xi \cdot 0{,}1^3 \le \frac{e^{0{,}1}}{6} \cdot 10^{-3} < \frac{2}{6}\cdot 10^{-3} \approx 3{,}4 \cdot 10^{-4}$.

(Tatsächlich: $e^{0{,}1} \approx 1{,}10517$, Fehler $\approx 1{,}7 \cdot 10^{-4}$.)`,
    },
    {
      id: 'taylor-sin',
      title: 'Taylorpolynom des Sinus',
      points: 5,
      task: r`Bestimme $T_3(\sin; 0)$ und gib eine Fehlerschranke für $|\sin x - T_3(\sin;0)(x)|$ an.`,
      solution: r`$\sin 0 = 0$, $\sin'(0) = \cos 0 = 1$, $\sin''(0) = -\sin 0 = 0$, $\sin'''(0) = -\cos 0 = -1$:

$$T_3(\sin; 0)(x) = x - \frac{x^3}{6}.$$

Wegen $|\sin^{(4)}(\xi)| = |\sin\xi| \le 1$ liefert die Restgliedabschätzung

$$|\sin x - T_3(x)| \le \frac{|x|^4}{4!} = \frac{|x|^4}{24}.$$`,
    },
    {
      id: 'fourier',
      title: 'Koeffizienten ablesen und nachrechnen',
      source: 'Theorem 366',
      points: 5,
      task: r`Sei $f(x) = 3\sin(2x) - \cos(x)$. Bestimme $\frac1\pi\int_0^{2\pi} f(x)\sin(2x)\,dx$ ohne lange Rechnung und begründe.`,
      solution: r`$f$ ist ein trigonometrisches Polynom der Ordnung $2$ mit $a_2 = 3$ (Koeffizient von $\sin 2x$), $b_1 = -1$ und allen übrigen Koeffizienten $0$.

Nach Theorem 366 ist $\frac1\pi\int_0^{2\pi} f(x)\sin(2x)\,dx = a_2 = 3$.

Begründung über die Orthogonalität: $\int_0^{2\pi} \sin^2(2x)\,dx = \pi$ und $\int_0^{2\pi} \cos(x)\sin(2x)\,dx = 0$.`,
    },
  ],
});
