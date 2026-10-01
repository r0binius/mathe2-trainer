import type { AppDefinition } from '@/domain/shortcuts/types';

import de from './de.json';
import en from './en.json';

/** The shortcuts in the menu bar of Bitwarden's desktop app, as of 2026-09-25. */
export const bitwarden = {
  id: 'bitwarden',
  title: 'Bitwarden',
  bundleIds: ['com.bitwarden.desktop'],
  category: 'system',
  catalogs: { de, en },
  sets: [
    {
      id: 'essentials',
      title: 'essentials.title',
      shortcuts: [
        { title: 'essentials.searchVault', keys: [['Meta', 'f']] },
        { title: 'essentials.newLogin', keys: [['Meta', 'n']] },
        { title: 'essentials.copyUsername', keys: [['Meta', 'u']] },
        { title: 'essentials.copyPassword', keys: [['Meta', 'p']] },
        { title: 'essentials.copyTotp', keys: [['Meta', 't']] },
        { title: 'essentials.generator', keys: [['Meta', 'g']] },
        { title: 'essentials.lockAllVaults', keys: [['Meta', 'l']] },
        { title: 'essentials.settings', keys: [['Meta', ',']] },
      ],
    },
    {
      id: 'newItem',
      title: 'newItem.title',
      shortcuts: [
        { title: 'newItem.login', keys: [['Shift', 'Meta', 'l']] },
        { title: 'newItem.card', keys: [['Shift', 'Meta', 'c']] },
        { title: 'newItem.identity', keys: [['Shift', 'Meta', 'i']] },
        { title: 'newItem.note', keys: [['Shift', 'Meta', 's']] },
        { title: 'newItem.sshKey', keys: [['Shift', 'Meta', 'k']] },
      ],
    },
    {
      id: 'window',
      title: 'window.title',
      shortcuts: [
        { title: 'window.hideToMenuBar', keys: [['Shift', 'Meta', 'm']] },
        { title: 'window.alwaysOnTop', keys: [['Shift', 'Meta', 't']] },
        { title: 'window.reload', keys: [['Shift', 'Meta', 'r']] },
      ],
    },
  ],
} satisfies AppDefinition;
