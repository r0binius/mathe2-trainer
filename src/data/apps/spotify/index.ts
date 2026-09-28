import type { AppDefinition } from '@/domain/shortcuts/types';

/** The shortcuts in Spotify's menu bar, as of 2026-09-25. */
export const spotify = {
  id: 'spotify',
  title: 'Spotify',
  category: 'music',
  sets: [
    {
      id: 'playback',
      title: 'playback.title',
      shortcuts: [
        { title: 'playback.playPause', keys: [['Space']] },
        { title: 'playback.next', keys: [['Meta', 'ArrowRight']] },
        { title: 'playback.previous', keys: [['Meta', 'ArrowLeft']] },
        { title: 'playback.seekForward', keys: [['Shift', 'Meta', 'ArrowRight']] },
        { title: 'playback.seekBackward', keys: [['Shift', 'Meta', 'ArrowLeft']] },
        { title: 'playback.shuffle', keys: [['Meta', 's']] },
        { title: 'playback.repeat', keys: [['Meta', 'r']] },
        { title: 'playback.volumeUp', keys: [['Meta', 'ArrowUp']] },
        { title: 'playback.volumeDown', keys: [['Meta', 'ArrowDown']] },
      ],
    },
    {
      id: 'navigation',
      title: 'navigation.title',
      shortcuts: [
        { title: 'navigation.search', keys: [['Meta', 'l']] },
        { title: 'navigation.filter', keys: [['Meta', 'f']] },
        { title: 'navigation.back', keys: [['Alt', 'Meta', 'ArrowLeft']] },
        { title: 'navigation.forward', keys: [['Alt', 'Meta', 'ArrowRight']] },
        { title: 'navigation.newPlaylist', keys: [['Meta', 'n']] },
        { title: 'navigation.newPlaylistFolder', keys: [['Shift', 'Meta', 'n']] },
      ],
    },
    {
      id: 'miscellaneous',
      title: 'miscellaneous.title',
      shortcuts: [
        { title: 'miscellaneous.actualSize', keys: [['Meta', '0']] },
        { title: 'miscellaneous.zoomIn', keys: [['Meta', '+']] },
        { title: 'miscellaneous.zoomOut', keys: [['Meta', '-']] },
        { title: 'miscellaneous.settings', keys: [['Meta', ',']] },
        { title: 'miscellaneous.help', keys: [['Meta', '?']] },
        { title: 'miscellaneous.logOut', keys: [['Shift', 'Meta', 'w']] },
        { title: 'miscellaneous.showWindow', keys: [['Alt', 'Meta', '1']] },
      ],
    },
  ],
} satisfies AppDefinition;
