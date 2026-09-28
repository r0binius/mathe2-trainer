import type { KeyCombination } from '@/domain/keyboard/combination';
import type { Session } from '@/domain/practice/session';

/** How one key cap of the answer is shown; see `KeyCap` for what each part looks like. */
export type KeyCapState = {
  readonly key: string;
  readonly hidden: boolean;
  readonly pressed: boolean;
  readonly result?: 'correct' | 'wrong';
};

/** A session that shows an item, while it waits for the keys or shows the success. */
export type ShowingSession<Pool> = Exclude<Session<Pool>, { readonly phase: 'finished' }>;

/**
 * The rows of key caps a practice screen shows for the session and the keys held: the keys to
 * press, and after a wrong test first what was pressed instead, each key marked right or wrong.
 */
export function keyCapsOf<Pool>(
  session: ShowingSession<Pool>,
  held: KeyCombination,
): readonly (readonly KeyCapState[])[] {
  const { keys } = session.item;

  if (session.phase === 'succeeded') {
    return [keys.map((key) => ({ key, hidden: false, pressed: true, result: 'correct' }))];
  }

  if (session.mode === 'training') {
    return [keys.map((key) => ({ key, hidden: false, pressed: held.includes(key) }))];
  }

  if (session.mistake === undefined) {
    return [keys.map((key) => ({ key, hidden: true, pressed: false }))];
  }

  return [
    session.mistake.map((key) => ({
      key,
      hidden: false,
      pressed: true,
      result: keys.includes(key) ? 'correct' : 'wrong',
    })),
    keys.map((key) => ({ key, hidden: false, pressed: held.includes(key) })),
  ];
}
