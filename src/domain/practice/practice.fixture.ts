import type { Attempt, PracticeItem } from './session';

/** A practice item for the shortcut ⌘ + `key` of a test app, titled `key`. */
export function item(key: string): PracticeItem {
  return { id: `app/Meta+${key}`, keys: ['Meta', key], title: key };
}

/** A correct first-try test of item `a` in one second, changed by `overrides`. */
export function attempt(overrides: Partial<Attempt> = {}): Attempt {
  return { item: item('a'), mode: 'testing', failed: false, durationMs: 1000, ...overrides };
}
