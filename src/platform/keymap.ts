// eslint-disable-next-line no-restricted-syntax -- a stand-in until step 6 reads the layout in Rust
import germanKeymap from '@/domain/keyboard/germanKeymap.fixture.json';
import type { CurrentLayout, KeymapSource } from '@/domain/keyboard/keymap';
import { ok } from '@/domain/shared/result';

const german: CurrentLayout = { id: 'com.apple.keylayout.German', keymap: germanKeymap };

/**
 * Always reports the German layout, from the test fixture. A stand-in, so the screens can be built
 * before step 6 reads the real layout in Rust.
 */
export const germanKeymapSource: KeymapSource = { load: () => Promise.resolve(ok(german)) };
