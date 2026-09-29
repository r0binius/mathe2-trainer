import type { AppDefinition } from '@/domain/shortcuts/types';

import de from './de.json';
import en from './en.json';

/**
 * The shortcuts in Terminal's menu bar, as of 2026-09-25, plus the line-editing shortcuts of zsh in
 * Emacs mode.
 */
export const terminal = {
  id: 'terminal',
  title: 'Terminal',
  category: 'development',
  catalogs: { de, en },
  sets: [
    {
      id: 'windows',
      title: 'windows.title',
      shortcuts: [
        { title: 'windows.newWindow', keys: [['Meta', 'n']] },
        { title: 'windows.newTab', keys: [['Meta', 't']] },
        { title: 'windows.newTabWithSameCommand', keys: [['Control', 'Meta', 't']] },
        { title: 'windows.closeTab', keys: [['Meta', 'w']] },
        { title: 'windows.closeWindow', keys: [['Shift', 'Meta', 'w']] },
        { title: 'windows.closeOtherTabs', keys: [['Alt', 'Meta', 'w']] },
        { title: 'windows.nextTab', keys: [['Control', 'Tab']] },
        { title: 'windows.previousTab', keys: [['Control', 'Shift', 'Tab']] },
        { title: 'windows.nextWindow', keys: [['Meta', '<']] },
        { title: 'windows.showAllTabs', keys: [['Shift', 'Meta', '#']] },
        { title: 'windows.toggleTabBar', keys: [['Shift', 'Meta', 't']] },
        { title: 'windows.split', keys: [['Meta', 'd']] },
        { title: 'windows.closeSplit', keys: [['Shift', 'Meta', 'd']] },
      ],
    },
    {
      id: 'shell',
      title: 'shell.title',
      shortcuts: [
        { title: 'shell.lineStart', keys: [['Control', 'a']] },
        { title: 'shell.lineEnd', keys: [['Control', 'e']] },
        { title: 'shell.deleteToLineStart', keys: [['Control', 'u']] },
        { title: 'shell.deleteToLineEnd', keys: [['Control', 'k']] },
        { title: 'shell.deleteWordBefore', keys: [['Control', 'w']] },
        { title: 'shell.searchHistory', keys: [['Control', 'r']] },
        { title: 'shell.interrupt', keys: [['Control', 'c']] },
        { title: 'shell.exit', keys: [['Control', 'd']] },
        { title: 'shell.clearScreen', keys: [['Control', 'l']] },
      ],
    },
    {
      id: 'edit',
      title: 'edit.title',
      shortcuts: [
        { title: 'edit.clearToStart', keys: [['Meta', 'k']] },
        { title: 'edit.clearScrollback', keys: [['Alt', 'Meta', 'k']] },
        { title: 'edit.clearToPreviousMark', keys: [['Meta', 'l']] },
        { title: 'edit.pasteSelection', keys: [['Shift', 'Meta', 'v']] },
        { title: 'edit.selectBetweenMarks', keys: [['Shift', 'Meta', 'a']] },
        { title: 'edit.mark', keys: [['Meta', 'u']] },
        { title: 'edit.insertBookmark', keys: [['Shift', 'Meta', 'm']] },
        { title: 'edit.previousMark', keys: [['Meta', 'ArrowUp']] },
        { title: 'edit.nextMark', keys: [['Meta', 'ArrowDown']] },
        { title: 'edit.find', keys: [['Meta', 'f']] },
        { title: 'edit.findNext', keys: [['Meta', 'g']] },
        { title: 'edit.findPrevious', keys: [['Shift', 'Meta', 'g']] },
      ],
    },
    {
      id: 'view',
      title: 'view.title',
      shortcuts: [
        { title: 'view.scrollToTop', keys: [['Meta', 'Home']] },
        { title: 'view.scrollToBottom', keys: [['Meta', 'End']] },
        { title: 'view.pageUp', keys: [['Meta', 'PageUp']] },
        { title: 'view.pageDown', keys: [['Meta', 'PageDown']] },
        { title: 'view.lineUp', keys: [['Alt', 'Meta', 'PageUp']] },
        { title: 'view.lineDown', keys: [['Alt', 'Meta', 'PageDown']] },
        { title: 'view.biggerText', keys: [['Meta', '+']] },
        { title: 'view.smallerText', keys: [['Meta', '-']] },
        { title: 'view.defaultFontSize', keys: [['Meta', '0']] },
      ],
    },
    {
      id: 'shellMenu',
      title: 'shellMenu.title',
      shortcuts: [
        { title: 'shellMenu.newCommand', keys: [['Shift', 'Meta', 'n']] },
        { title: 'shellMenu.newRemoteConnection', keys: [['Shift', 'Meta', 'k']] },
        { title: 'shellMenu.showInspector', keys: [['Meta', 'i']] },
        { title: 'shellMenu.editTitle', keys: [['Shift', 'Meta', 'i']] },
        { title: 'shellMenu.reset', keys: [['Alt', 'Meta', 'r']] },
        { title: 'shellMenu.hardReset', keys: [['Control', 'Alt', 'Meta', 'r']] },
        { title: 'shellMenu.useOptionAsMeta', keys: [['Alt', 'Meta', 'o']] },
        { title: 'shellMenu.exportText', keys: [['Meta', 's']] },
      ],
    },
  ],
} satisfies AppDefinition;
