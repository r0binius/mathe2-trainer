import type { Topic } from '@/domain/content/types';

import { abzaehlbarkeit } from './topics/abzaehlbarkeit';
import { differenzialrechnung } from './topics/differenzialrechnung';
import { folgen } from './topics/folgen';
import { funktionen } from './topics/funktionen';
import { integralrechnung } from './topics/integralrechnung';
import { kombinatorik } from './topics/kombinatorik';
import { polynome } from './topics/polynome';
import { reelleZahlen } from './topics/reelle-zahlen';
import { reihen } from './topics/reihen';
import { stetigkeit } from './topics/stetigkeit';

/** Everything the trainer teaches, in the order of the lecture notes (chapters 7 to 13). */
export const topics: readonly Topic[] = [
  kombinatorik,
  abzaehlbarkeit,
  reelleZahlen,
  folgen,
  reihen,
  polynome,
  funktionen,
  stetigkeit,
  differenzialrechnung,
  integralrechnung,
];
