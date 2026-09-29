import type { PracticeItem, Session } from '@/domain/practice/session';

/**
 * What a practice screen tells VoiceOver, for what's shown right now: a shortcut to train (with
 * its keys) or to recall (without), a wrong answer while training or testing or a forgotten test
 * (with the right keys), or a correct answer.
 */
export type Announcement = {
  readonly kind: 'train' | 'test' | 'miss' | 'wrong' | 'forgot' | 'correct';
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
      return { kind: kindWhilePresenting(session), item: session.item };
  }
}

type Presenting<Pool> = Extract<Session<Pool>, { readonly phase: 'presenting' }>;

function kindWhilePresenting<Pool>({
  mode,
  misses,
  failure,
}: Presenting<Pool>): Announcement['kind'] {
  if (mode === 'training') {
    return misses === 0 ? 'train' : 'miss';
  }

  return failure === undefined ? 'test' : failure.kind;
}
