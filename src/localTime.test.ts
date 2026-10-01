import { describe, expect, it } from 'vitest';

import { localTimeAt } from './localTime';

describe('localTimeAt', () => {
  it('gives a moment the offset east of UTC that the system has at that moment', () => {
    const at = Date.UTC(2026, 0, 15, 12);

    expect(localTimeAt(at)).toStrictEqual({
      at,
      utcOffsetMinutes: -new Date(at).getTimezoneOffset(),
    });
  });
});
