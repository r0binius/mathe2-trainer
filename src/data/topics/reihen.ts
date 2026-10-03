import { topic } from '@/domain/content/build';

const r = String.raw;

/** Chapter 9.4 of the lecture notes: series and their convergence tests. */
export const reihen = topic({
  id: 'reihen',
  chapter: '9.4',
  title: 'Reihen',
  summary: 'Partialsummen, geometrische Reihe, absolute Konvergenz und die Konvergenzkriterien.',
  definitions: [
    {
      id: 'reihe',
      title: 'Reihe und Partialsumme',
      ref: 'Definition 211',
      statement: r`Sei $(a_n)$ eine Folge in $\C$ und $s_n := \sum_{k=1}^{n} a_k$. Dann heißt die Folge $(s_n)_{n\in\N}$ **(unendliche) Reihe**, und $s_n$ heißt die **$n$-te Partialsumme**. Schreibweise: $\sum_{k=1}^{\infty} a_k$.

Konvergiert die Reihe, so bezeichnet $\sum_{k=1}^{\infty} a_k$ auch ihren Grenzwert:

$$\sum_{k=1}^{\infty} a_k = \lim_{n\to\infty} \sum_{k=1}^{n} a_k.$$`,
      note: r`Eine Reihe ist also nichts anderes als die **Folge ihrer Partialsummen**. Das Symbol ist doppeldeutig: die Reihe an sich oder ihr Wert.`,
    },
    {
      id: 'geometrische-reihe',
      title: 'Geometrische Reihe',
      ref: 'Beispiel 212',
      statement: r`Seien $z, a \in \C$. Die Reihe

$$\sum_{k=0}^{\infty} (z - a)^k$$

heißt **geometrische Reihe** mit Entwicklungspunkt $a$. Sie konvergiert für $|z - a| < 1$ gegen $\dfrac{1}{1 - (z - a)}$.`,
      note: r`Standardfall $a = 0$: $\sum_{k=0}^\infty q^k = \frac{1}{1-q}$ für $|q| < 1$. Dahinter steckt die geometrische Summenformel $\sum_{k=0}^n q^k = \frac{1 - q^{n+1}}{1 - q}$.`,
    },
    {
      id: 'potenzreihe',
      title: 'Potenzreihe und Konvergenzradius',
      ref: 'Bemerkung 213',
      statement: r`Eine **Potenzreihe** mit Entwicklungspunkt $a$ ist eine Reihe der Form

$$\sum_{k=0}^{\infty} a_k (z - a)^k$$

mit einer Koeffizientenfolge $(a_k)$. Der Wert

$$\rho_a := \sup\Bigl\{ |z - a| \;\Bigm|\; \sum_{k=0}^{\infty} a_k (z-a)^k \text{ konvergiert} \Bigr\}$$

heißt **Konvergenzradius** der Potenzreihe.`,
      note: r`Eine Potenzreihe konvergiert immer mindestens für $z = a$ (Wert $a_0$).`,
    },
    {
      id: 'absolut-konvergent',
      title: 'Absolute Konvergenz',
      ref: 'Definition 221',
      statement: r`Eine Reihe $\sum_{n=1}^{\infty} a_n$ heißt **absolut konvergent**, wenn die Reihe der Absolutbeträge

$$\sum_{n=1}^{\infty} |a_n|$$

konvergiert.`,
      note: r`Absolut konvergent $\Rightarrow$ konvergent, aber nicht umgekehrt: $\sum \frac{(-1)^n}{n}$ konvergiert, aber nicht absolut.`,
    },
    {
      id: 'cauchy-produkt-def',
      title: 'Cauchy-Produkt zweier Reihen',
      ref: 'Theorem 231',
      statement: r`Das **Cauchy-Produkt** der Reihen $\sum_{n=0}^\infty a_n$ und $\sum_{n=0}^\infty b_n$ ist die Reihe $\sum_{n=0}^\infty c_n$ mit

$$c_n := \sum_{k=0}^{n} a_k b_{n-k}.$$`,
    },
  ],
  theorems: [
    {
      id: 'linearitaet',
      title: 'Rechenregeln für konvergente Reihen',
      ref: 'Theorem 218',
      statement: r`Seien $\sum_{n=1}^\infty a_n$ und $\sum_{n=1}^\infty b_n$ konvergente Reihen in $\C$ und $\lambda \in \C$. Dann gilt:

- $\sum_{n=1}^\infty (a_n \pm b_n)$ konvergiert gegen $\sum_{n=1}^\infty a_n \pm \sum_{n=1}^\infty b_n$,
- $\sum_{n=1}^\infty \lambda a_n$ konvergiert gegen $\lambda \sum_{n=1}^\infty a_n$.`,
    },
    {
      id: 'notwendiges-kriterium',
      title: 'Notwendiges Kriterium (Nullfolgenkriterium)',
      ref: 'Theorem 219',
      statement: r`Sei $\sum_{n=1}^{\infty} a_n$ eine konvergente Reihe. Dann ist $(a_n)$ eine **Nullfolge**.`,
      note: r`Nur notwendig, nicht hinreichend: Die harmonische Reihe $\sum \frac1n$ divergiert, obwohl $\frac1n \to 0$. Nützlich in der Kontraposition: $a_n \not\to 0 \Rightarrow$ Reihe divergiert.`,
    },
    {
      id: 'harmonische-reihe',
      title: 'Harmonische Reihe',
      ref: 'Beispiel 217',
      statement: r`Die harmonische Reihe

$$\sum_{k=1}^{\infty} \frac{1}{k}$$

**divergiert**.`,
      note: r`Beweisidee: $s_{2n} - s_n = \sum_{k=n+1}^{2n} \frac1k \ge n \cdot \frac{1}{2n} = \frac12$ – die Partialsummen bilden keine Cauchy-Folge.`,
    },
    {
      id: 'majorantenkriterium',
      title: 'Majorantenkriterium von Weierstraß',
      ref: 'Theorem 222',
      statement: r`Sei $(c_n)$ eine Folge in $[0, +\infty[$ mit konvergenter Reihe $\sum_{n=1}^\infty c_n$, und sei $(a_n)$ eine Folge in $\C$ mit

$$|a_n| \le c_n \quad \text{für alle } n \in \N.$$

Dann ist $\sum_{n=1}^{\infty} a_n$ **absolut konvergent**. Die Reihe $\sum c_n$ heißt **Majorante** von $\sum a_n$.`,
      note: r`Typische Majoranten: geometrische Reihe $\sum q^n$ ($0 \le q < 1$) und $\sum \frac{1}{n^2}$.`,
    },
    {
      id: 'minorantenkriterium',
      title: 'Minorantenkriterium',
      ref: 'Korollar 224',
      statement: r`Seien $(a_n)$, $(b_n)$ Folgen in $\R$. Gibt es ein $N \in \N$ mit $0 \le a_n \le b_n$ für alle $n \ge N$, und ist $\sum_{n=1}^\infty a_n$ **divergent**, dann ist auch $\sum_{n=1}^\infty b_n$ divergent.`,
      note: r`Typische divergente Minorante: die harmonische Reihe.`,
    },
    {
      id: 'quotientenkriterium',
      title: 'Quotientenkriterium',
      ref: 'Theorem 227',
      statement: r`Sei $(a_n)$ eine Folge in $\C$. Es gebe ein $N \in \N$ und eine Zahl $q \in\, ]0, 1[$, sodass für alle $n \ge N$ gilt

$$a_n \ne 0 \quad \text{und} \quad \left|\frac{a_{n+1}}{a_n}\right| \le q.$$

Dann ist $\sum_{n=1}^{\infty} a_n$ **absolut konvergent**.`,
      note: r`Falle: $\left|\frac{a_{n+1}}{a_n}\right| < 1$ genügt **nicht** – es braucht ein festes $q < 1$. Bei der harmonischen Reihe ist der Quotient $\frac{n}{n+1} < 1$, sie divergiert trotzdem.`,
    },
    {
      id: 'leibniz',
      title: 'Leibnizkriterium',
      ref: 'Theorem 229',
      statement: r`Sei $(a_n)$ eine **monoton fallende Nullfolge**. Dann konvergiert die alternierende Reihe

$$\sum_{n=0}^{\infty} (-1)^n a_n.$$`,
      note: r`Beispiel: Die alternierende harmonische Reihe $\sum \frac{(-1)^n}{n}$ konvergiert, aber nicht absolut.`,
    },
    {
      id: 'cauchy-produkt',
      title: 'Cauchy-Produkt absolut konvergenter Reihen',
      ref: 'Theorem 231',
      statement: r`Seien $\sum_{n=0}^\infty a_n$ und $\sum_{n=0}^\infty b_n$ **absolut konvergent** und $c_n := \sum_{k=0}^{n} a_k b_{n-k}$. Dann konvergiert $\sum_{n=0}^\infty c_n$ absolut, und es gilt

$$\sum_{n=0}^{\infty} c_n = \left(\sum_{n=0}^{\infty} a_n\right) \left(\sum_{n=0}^{\infty} b_n\right).$$`,
      note: r`Damit beweist man die Funktionalgleichung $\exp(z + w) = \exp(z)\exp(w)$.`,
    },
    {
      id: 'absolut-impliziert',
      title: 'Absolute Konvergenz impliziert Konvergenz',
      ref: 'nach Definition 221',
      statement: r`Jede absolut konvergente Reihe ist auch im gewöhnlichen Sinne konvergent.`,
      note: r`Begründung über das Cauchy-Kriterium: $\left|\sum_{k=m+1}^{n} a_k\right| \le \sum_{k=m+1}^{n} |a_k|$.`,
    },
  ],
  claims: [
    {
      id: 'nullfolge-hinreichend',
      statement: r`Ist $(a_n)$ eine Nullfolge, so konvergiert $\sum_{n=1}^\infty a_n$.`,
      holds: false,
      reason: r`Gegenbeispiel: harmonische Reihe. Das Nullfolgenkriterium ist nur notwendig.`,
    },
    {
      id: 'geometrisch-halb',
      statement: r`$\sum_{k=0}^{\infty} \left(\frac{1}{2}\right)^k = 2$`,
      holds: true,
      reason: r`Geometrische Reihe: $\frac{1}{1 - \frac12} = 2$.`,
    },
    {
      id: 'geometrisch-ab-eins',
      statement: r`$\sum_{k=1}^{\infty} \left(\frac{1}{3}\right)^k = \frac{3}{2}$`,
      holds: false,
      reason: r`$\frac32$ ist der Wert ab $k = 0$. Ab $k = 1$ fehlt der Summand $1$: $\frac32 - 1 = \frac12$.`,
    },
    {
      id: 'quotient-kleiner-eins',
      statement: r`Gilt $\left|\frac{a_{n+1}}{a_n}\right| < 1$ für alle $n$, so konvergiert $\sum a_n$.`,
      holds: false,
      reason: r`Für $a_n = \frac1n$ ist der Quotient $\frac{n}{n+1} < 1$, die Reihe divergiert. Man braucht $\le q$ mit festem $q < 1$.`,
    },
    {
      id: 'alternierend-harmonisch',
      statement: r`Die Reihe $\sum_{n=1}^\infty \frac{(-1)^n}{n}$ ist konvergent, aber nicht absolut konvergent.`,
      holds: true,
      reason: r`Konvergent nach Leibniz ($\frac1n$ ist monoton fallende Nullfolge); die Reihe der Beträge ist die harmonische Reihe.`,
    },
    {
      id: 'eins-durch-n-quadrat',
      statement: r`Die Reihe $\sum_{n=1}^\infty \frac{1}{n^2}$ divergiert, weil die harmonische Reihe divergiert.`,
      holds: false,
      reason: r`$\sum \frac{1}{n^2}$ konvergiert, z. B. mit der Majorante $\frac{1}{n(n-1)} = \frac{1}{n-1} - \frac1n$ (Teleskopsumme) für $n \ge 2$.`,
    },
    {
      id: 'exp-radius',
      statement: r`Die Potenzreihe $\sum_{n=0}^\infty \frac{z^n}{n!}$ hat den Konvergenzradius $+\infty$.`,
      holds: true,
      reason: r`Quotientenkriterium: $\left|\frac{z^{n+1}/(n+1)!}{z^n/n!}\right| = \frac{|z|}{n+1} \le \frac12$ für $n \ge 2|z|$. Sie konvergiert für jedes $z \in \C$ absolut.`,
    },
    {
      id: 'partialsummen-beschraenkt',
      statement: r`Eine Reihe mit beschränkter Partialsummenfolge ist konvergent.`,
      holds: false,
      reason: r`$\sum_{n=0}^\infty (-1)^n$ hat die Partialsummen $1, 0, 1, 0, \dots$ – beschränkt, aber divergent. (Für Reihen mit $a_n \ge 0$ stimmt es, da die Partialsummen dann monoton wachsen.)`,
    },
    {
      id: 'majorante-divergent',
      statement: r`Gilt $0 \le a_n \le b_n$ und divergiert $\sum b_n$, so divergiert auch $\sum a_n$.`,
      holds: false,
      reason: r`Falsche Richtung: $a_n = \frac{1}{n^2} \le b_n = \frac1n$. Divergenz vererbt sich nach **oben** (Minorantenkriterium), Konvergenz nach **unten**.`,
    },
    {
      id: 'null-komma-neun',
      statement: r`$0{,}\overline{9} = \sum_{k=1}^\infty \frac{9}{10^k} = 1$`,
      holds: true,
      reason: r`$9 \cdot \left(\frac{1}{1 - \frac{1}{10}} - 1\right) = 9 \cdot \frac19 = 1$.`,
    },
  ],
  problems: [
    {
      id: 'n-quadrat-durch-2n',
      title: 'Quotientenkriterium anwenden',
      source: 'Blatt 1, Aufgabe 7 a)',
      points: 4,
      task: r`Untersuche $\sum_{n=0}^{\infty} \frac{n^2}{2^n}$ auf Konvergenz und absolute Konvergenz.`,
      solution: r`Für $n \ge 1$ ist $a_n = \frac{n^2}{2^n} \ne 0$ und

$$\left|\frac{a_{n+1}}{a_n}\right| = \frac{(n+1)^2}{2^{n+1}} \cdot \frac{2^n}{n^2} = \frac12 \left(1 + \frac1n\right)^2.$$

Für $n \ge 3$ ist das $\le \frac12 \cdot \left(\frac43\right)^2 = \frac89 =: q < 1$. Nach dem Quotientenkriterium ist die Reihe absolut konvergent (also auch konvergent).`,
    },
    {
      id: 'rationale-reihe',
      title: 'Minorantenkriterium anwenden',
      source: 'Blatt 1, Aufgabe 7 b)',
      points: 4,
      task: r`Untersuche $\sum_{n=2}^{\infty} \frac{n^3 + 3n^2 + 3n + 1}{n^4 - n - 1}$ auf Konvergenz.`,
      hint: r`Der Summand verhält sich wie $\frac1n$. Schätze nach unten ab.`,
      solution: r`Der Zähler ist $(n+1)^3 \ge n^3$, der Nenner erfüllt für $n \ge 2$: $0 < n^4 - n - 1 \le n^4$. Also

$$b_n := \frac{n^3 + 3n^2 + 3n + 1}{n^4 - n - 1} \ge \frac{n^3}{n^4} = \frac1n \ge 0.$$

Die harmonische Reihe ist eine divergente Minorante; nach dem Minorantenkriterium divergiert die Reihe. (Absolut konvergent ist sie damit erst recht nicht.)`,
    },
    {
      id: 'i-hoch-n-durch-n',
      title: 'Eine komplexe alternierende Reihe',
      source: 'angelehnt an Blatt 1, Aufgabe 7 c)',
      points: 6,
      task: r`Untersuche $\sum_{n=1}^{\infty} \frac{i^n}{n}$ auf Konvergenz und absolute Konvergenz.`,
      hint: r`Trenne Real- und Imaginärteil.`,
      solution: r`**Nicht absolut konvergent:** $\left|\frac{i^n}{n}\right| = \frac1n$, und die harmonische Reihe divergiert.

**Konvergent:** Es ist $i^n \in \{i, -1, -i, 1\}$. Der Realteil der Reihe ist $-\frac12 + \frac14 - \frac16 \pm \dots = \sum_{k=1}^\infty \frac{(-1)^k}{2k}$, der Imaginärteil $1 - \frac13 + \frac15 \mp \dots = \sum_{k=0}^\infty \frac{(-1)^k}{2k+1}$.

Beide sind alternierende Reihen mit monoton fallenden Nullfolgen $\frac{1}{2k}$ bzw. $\frac{1}{2k+1}$, konvergieren also nach Leibniz. Eine komplexe Folge (hier: der Partialsummen) konvergiert genau dann, wenn Real- und Imaginärteil konvergieren.`,
    },
    {
      id: 'wurzel-reihen',
      title: 'Teleskopsumme und Leibniz',
      source: 'Blatt 2, Aufgabe 1 b)',
      points: 6,
      task: r`Für $k \in \N_0$ sei $a_k := \sqrt{k+1} - \sqrt{k}$. Untersuche $\sum_{k=0}^\infty a_k$ und $\sum_{k=0}^\infty (-1)^k a_k$ auf Konvergenz.`,
      solution: r`**Erste Reihe:** Teleskopsumme: $s_n = \sum_{k=0}^{n} (\sqrt{k+1} - \sqrt{k}) = \sqrt{n+1}$. Die Partialsummen sind unbeschränkt, die Reihe divergiert.

**Zweite Reihe:** $a_k = \frac{1}{\sqrt{k+1} + \sqrt{k}}$ ist positiv, monoton fallend (der Nenner wächst) und eine Nullfolge. Nach dem Leibnizkriterium konvergiert $\sum (-1)^k a_k$.

Sie konvergiert aber nicht absolut, denn $\sum |(-1)^k a_k| = \sum a_k$ divergiert.`,
    },
    {
      id: 'geometrische-werte',
      title: 'Werte geometrischer Reihen',
      points: 4,
      task: r`Berechne

a) $\sum_{k=0}^{\infty} \frac{2}{3^k}$
b) $\sum_{k=2}^{\infty} \left(-\frac12\right)^k$`,
      solution: r`a) $2 \cdot \frac{1}{1 - \frac13} = 2 \cdot \frac32 = 3$.

b) $\sum_{k=0}^\infty \left(-\frac12\right)^k = \frac{1}{1 + \frac12} = \frac23$. Abziehen der Summanden für $k = 0, 1$: $\frac23 - 1 + \frac12 = \frac16$.

Alternativ: $\left(-\frac12\right)^2 \cdot \frac23 = \frac14 \cdot \frac23 = \frac16$.`,
    },
    {
      id: 'absolut-cauchy',
      title: 'Partialsummen einer absolut konvergenten Reihe',
      source: 'Blatt 2, Aufgabe 1 a)',
      points: 5,
      task: r`Sei $\sum_{k=0}^\infty a_k$ eine absolut konvergente Reihe in $\R$. Zeige, dass die Partialsummenfolge $(s_n)$ eine Cauchy-Folge ist.`,
      solution: r`Sei $t_n := \sum_{k=0}^n |a_k|$. Nach Voraussetzung konvergiert $(t_n)$, ist also eine Cauchy-Folge: Zu $\varepsilon > 0$ gibt es $N$ mit $|t_n - t_m| \le \varepsilon$ für $n \ge m \ge N$.

Für solche $n \ge m$ folgt mit der Dreiecksungleichung

$$|s_n - s_m| = \left|\sum_{k=m+1}^{n} a_k\right| \le \sum_{k=m+1}^{n} |a_k| = t_n - t_m \le \varepsilon.$$

Also ist $(s_n)$ eine Cauchy-Folge (und damit in $\R$ konvergent).`,
    },
  ],
});
