import { expect } from 'vitest';

import type { CardMemory, CardMemoryFields } from './scheduler';
import { parseCardMemory } from './scheduler';

/** Parses memory written in a test, failing the test if the literal itself is invalid. */
export function validMemory(fields: CardMemoryFields): CardMemory {
  const parsed = parseCardMemory(fields);

  return parsed.kind === 'ok' ? parsed.value : expect.unreachable(JSON.stringify(parsed.error));
}
