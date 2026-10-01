import type { AppDefinition } from '@/domain/shortcuts/types';

import de from './de.json';
import en from './en.json';

/** The shortcuts in the menu bar of Apple's Notes, as of 2026-09-25. */
export const notes = {
  id: 'notes',
  title: 'Notes',
  bundleIds: ['com.apple.Notes'],
  category: 'productivity',
  catalogs: { de, en },
  sets: [
    {
      id: 'essentials',
      title: 'essentials.title',
      shortcuts: [
        { title: 'essentials.newNote', keys: [['Meta', 'n']] },
        { title: 'essentials.newFolder', keys: [['Shift', 'Meta', 'n']] },
        { title: 'essentials.duplicateNote', keys: [['Meta', 'd']] },
        { title: 'essentials.searchNotes', keys: [['Alt', 'Meta', 'f']] },
        { title: 'essentials.findInNote', keys: [['Meta', 'f']] },
        { title: 'essentials.findAndReplace', keys: [['Shift', 'Meta', 'f']] },
        { title: 'essentials.addLink', keys: [['Meta', 'k']] },
        { title: 'essentials.attachFile', keys: [['Shift', 'Meta', 'a']] },
        { title: 'essentials.insertLine', keys: [['Meta', 'l']] },
      ],
    },
    {
      id: 'formats',
      title: 'formats.title',
      shortcuts: [
        { title: 'formats.heading1', keys: [['Shift', 'Meta', 't']] },
        { title: 'formats.heading2', keys: [['Shift', 'Meta', 'h']] },
        { title: 'formats.heading3', keys: [['Shift', 'Meta', 'j']] },
        { title: 'formats.body', keys: [['Shift', 'Meta', 'b']] },
        { title: 'formats.monostyled', keys: [['Shift', 'Meta', 'm']] },
        { title: 'formats.bulletedList', keys: [['Shift', 'Meta', '7']] },
        { title: 'formats.dashedList', keys: [['Shift', 'Meta', '8']] },
        { title: 'formats.numberedList', keys: [['Shift', 'Meta', '9']] },
        { title: 'formats.blockQuote', keys: [['Meta', '´']] },
        { title: 'formats.checklist', keys: [['Shift', 'Meta', 'l']] },
        { title: 'formats.markAsChecked', keys: [['Shift', 'Meta', 'u']] },
        { title: 'formats.table', keys: [['Alt', 'Meta', 't']] },
      ],
    },
    {
      id: 'text',
      title: 'text.title',
      shortcuts: [
        { title: 'text.bold', keys: [['Meta', 'b']] },
        { title: 'text.italic', keys: [['Meta', 'i']] },
        { title: 'text.underline', keys: [['Meta', 'u']] },
        { title: 'text.highlight', keys: [['Shift', 'Meta', 'e']] },
        { title: 'text.copyStyle', keys: [['Alt', 'Meta', 'c']] },
        { title: 'text.pasteStyle', keys: [['Alt', 'Meta', 'v']] },
        { title: 'text.increaseIndent', keys: [['Meta', 'ä']] },
        { title: 'text.decreaseIndent', keys: [['Meta', 'ö']] },
        { title: 'text.alignLeft', keys: [['Shift', 'Meta', 'ö']] },
        { title: 'text.alignRight', keys: [['Shift', 'Meta', 'ä']] },
        { title: 'text.moveItemUp', keys: [['Control', 'Meta', 'ArrowUp']] },
        { title: 'text.moveItemDown', keys: [['Control', 'Meta', 'ArrowDown']] },
      ],
    },
    {
      id: 'view',
      title: 'view.title',
      shortcuts: [
        { title: 'view.asList', keys: [['Meta', '1']] },
        { title: 'view.asGallery', keys: [['Meta', '2']] },
        { title: 'view.attachments', keys: [['Meta', '3']] },
        { title: 'view.toggleSidebar', keys: [['Control', 'Meta', 's']] },
        { title: 'view.tags', keys: [['Control', 'Meta', 'i']] },
        { title: 'view.activity', keys: [['Control', 'Meta', 'k']] },
        { title: 'view.previousNote', keys: [['Alt', 'Meta', 'ö']] },
        { title: 'view.nextNote', keys: [['Alt', 'Meta', 'ä']] },
        { title: 'view.expandSection', keys: [['Alt', 'Meta', 'ArrowRight']] },
        { title: 'view.expandAllSections', keys: [['Alt', 'Shift', 'Meta', 'ArrowRight']] },
        { title: 'view.collapseSection', keys: [['Alt', 'Meta', 'ArrowLeft']] },
        { title: 'view.collapseAllSections', keys: [['Alt', 'Shift', 'Meta', 'ArrowLeft']] },
        { title: 'view.zoomIn', keys: [['Shift', 'Meta', '.']] },
        { title: 'view.zoomOut', keys: [['Shift', 'Meta', ',']] },
        { title: 'view.actualSize', keys: [['Shift', 'Meta', '0']] },
      ],
    },
  ],
} satisfies AppDefinition;
