import type { AppDefinition } from '@/domain/shortcuts/types';

import de from './de.json';
import en from './en.json';

/** The shortcuts in Helium's menu bar, as of 2026-09-25. */
export const helium = {
  id: 'helium',
  title: 'Helium',
  category: 'internet',
  catalogs: { de, en },
  sets: [
    {
      id: 'essentials',
      title: 'essentials.title',
      shortcuts: [
        { title: 'essentials.newTab', keys: [['Meta', 't']] },
        { title: 'essentials.newWindow', keys: [['Meta', 'n']] },
        { title: 'essentials.newIncognitoWindow', keys: [['Shift', 'Meta', 'n']] },
        { title: 'essentials.reopenClosedTab', keys: [['Shift', 'Meta', 't']] },
        { title: 'essentials.openLocation', keys: [['Meta', 'l']] },
        { title: 'essentials.closeTab', keys: [['Meta', 'w']] },
        { title: 'essentials.closeWindow', keys: [['Shift', 'Meta', 'w']] },
        { title: 'essentials.openFile', keys: [['Meta', 'o']] },
        { title: 'essentials.print', keys: [['Meta', 'p']] },
      ],
    },
    {
      id: 'tabs',
      title: 'tabs.title',
      shortcuts: [
        {
          title: 'tabs.next',
          keys: [
            ['Control', 'Tab'],
            ['Alt', 'Meta', 'ArrowRight'],
          ],
        },
        {
          title: 'tabs.previous',
          keys: [
            ['Control', 'Shift', 'Tab'],
            ['Alt', 'Meta', 'ArrowLeft'],
          ],
        },
        { title: 'tabs.first', keys: [['Meta', '1']] },
        { title: 'tabs.last', keys: [['Meta', '9']] },
        { title: 'tabs.search', keys: [['Shift', 'Meta', 'a']] },
        { title: 'tabs.addToSplitView', keys: [['Alt', 'Meta', 'n']] },
      ],
    },
    {
      id: 'navigation',
      title: 'navigation.title',
      shortcuts: [
        { title: 'navigation.back', keys: [['Meta', 'ö']] },
        { title: 'navigation.forward', keys: [['Meta', 'ä']] },
        { title: 'navigation.reload', keys: [['Meta', 'r']] },
        { title: 'navigation.forceReload', keys: [['Shift', 'Meta', 'r']] },
        { title: 'navigation.stop', keys: [['Meta', '.']] },
        { title: 'navigation.home', keys: [['Shift', 'Meta', 'h']] },
        { title: 'navigation.history', keys: [['Meta', 'y']] },
        { title: 'navigation.clearBrowsingData', keys: [['Shift', 'Meta', 'Backspace']] },
      ],
    },
    {
      id: 'bookmarks',
      title: 'bookmarks.title',
      shortcuts: [
        { title: 'bookmarks.bookmarkTab', keys: [['Meta', 'd']] },
        { title: 'bookmarks.bookmarkAllTabs', keys: [['Shift', 'Meta', 'd']] },
        { title: 'bookmarks.manager', keys: [['Alt', 'Meta', 'b']] },
        { title: 'bookmarks.toggleBar', keys: [['Shift', 'Meta', 'b']] },
      ],
    },
    {
      id: 'search',
      title: 'search.title',
      shortcuts: [
        { title: 'search.find', keys: [['Meta', 'f']] },
        { title: 'search.findNext', keys: [['Meta', 'g']] },
        { title: 'search.findPrevious', keys: [['Shift', 'Meta', 'g']] },
        { title: 'search.useSelection', keys: [['Meta', 'e']] },
        { title: 'search.searchWeb', keys: [['Alt', 'Meta', 'f']] },
      ],
    },
    {
      id: 'developer',
      title: 'developer.title',
      shortcuts: [
        { title: 'developer.actualSize', keys: [['Meta', '0']] },
        { title: 'developer.zoomIn', keys: [['Meta', '+']] },
        { title: 'developer.zoomOut', keys: [['Meta', '-']] },
        { title: 'developer.tools', keys: [['Shift', 'Meta', 'i']] },
        { title: 'developer.inspectElements', keys: [['Alt', 'Meta', 'c']] },
        { title: 'developer.console', keys: [['Alt', 'Meta', 'j']] },
        { title: 'developer.viewSource', keys: [['Alt', 'Meta', 'u']] },
      ],
    },
  ],
} satisfies AppDefinition;
