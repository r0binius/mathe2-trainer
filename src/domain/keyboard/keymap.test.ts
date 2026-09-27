import { describe, expectTypeOf, it } from 'vitest';

import germanKeymap from './germanKeymap.fixture.json';
import type { KeyCode, Keymap } from './keymap';

describe('Keymap', () => {
  it('describes the German keymap', () => {
    expectTypeOf(germanKeymap).toExtend<Keymap>();
  });

  it('knows exactly the key codes of the German keymap', () => {
    expectTypeOf<keyof typeof germanKeymap>().toEqualTypeOf<KeyCode>();
  });
});
