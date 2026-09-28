import type { AppDefinition } from '@/domain/shortcuts/types';

import { bitwarden } from './apps/bitwarden';
import { bitwig } from './apps/bitwig';
import { helium } from './apps/helium';
import { macos } from './apps/macos';
import { notes } from './apps/notes';
import { rectangle } from './apps/rectangle';
import { spotify } from './apps/spotify';
import { terminal } from './apps/terminal';
import { vscodium } from './apps/vscodium';
import { whatsapp } from './apps/whatsapp';

/** Every app Mouseless teaches. A new app is added here once its folder exists. */
export const apps: readonly AppDefinition[] = [
  bitwarden,
  bitwig,
  helium,
  macos,
  notes,
  rectangle,
  spotify,
  terminal,
  vscodium,
  whatsapp,
];
