import type { Mode, PracticeItem, Session } from '@/domain/practice/session';

/**
 * What a practice screen tells VoiceOver, for what's shown right now: a shortcut to train (with
 * its keys) or to recall (without), a wrong answer while training or testing (with the right
 * keys), or a correct one.
 */
export type Announcement = {
  readonly kind: 'train' | 'test' | 'miss' | 'wrong' | 'correct';
  readonly item: PracticeItem;
};

/** The announcement for the session's current state, or `undefined` once it's over. */
export function announcementOf<Pool>(session: Session<Pool>): Announcement | undefined {
  switch (session.phase) {
    case 'finished':
      return undefined;
    case 'succeeded':
      return { kind: 'correct', item: session.item };
    case 'presenting':
      return { kind: kindWhilePresenting(session.mode, session.misses), item: session.item };
  }
}

function kindWhilePresenting(mode: Mode, misses: number): Announcement['kind'] {
  if (misses === 0) {
    return mode === 'training' ? 'train' : 'test';
  }

  return mode === 'training' ? 'miss' : 'wrong';
}
