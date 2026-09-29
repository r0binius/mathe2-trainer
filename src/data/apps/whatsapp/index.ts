import type { AppDefinition } from '@/domain/shortcuts/types';

import de from './de.json';
import en from './en.json';

/** The shortcuts in WhatsApp's menu bar, as of 2026-09-25. */
export const whatsapp = {
  id: 'whatsapp',
  title: 'WhatsApp',
  category: 'communication',
  catalogs: { de, en },
  sets: [
    {
      id: 'essentials',
      title: 'essentials.title',
      shortcuts: [
        { title: 'essentials.chats', keys: [['Control', '1']] },
        { title: 'essentials.updates', keys: [['Control', '2']] },
        { title: 'essentials.communities', keys: [['Control', '3']] },
        { title: 'essentials.calls', keys: [['Control', '4']] },
        { title: 'essentials.media', keys: [['Control', '5']] },
        { title: 'essentials.back', keys: [['Meta', 'ö']] },
        { title: 'essentials.previousChat', keys: [['Shift', 'Meta', 'ö']] },
        { title: 'essentials.nextChat', keys: [['Shift', 'Meta', 'ä']] },
        { title: 'essentials.search', keys: [['Meta', 'f']] },
        { title: 'essentials.settings', keys: [['Meta', ',']] },
      ],
    },
    {
      id: 'view',
      title: 'view.title',
      shortcuts: [
        { title: 'view.zoomIn', keys: [['Meta', '+']] },
        { title: 'view.zoomOut', keys: [['Meta', '-']] },
        { title: 'view.actualSize', keys: [['Meta', '0']] },
      ],
    },
  ],
} satisfies AppDefinition;
