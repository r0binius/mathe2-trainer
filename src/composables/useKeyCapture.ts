import type { Ref } from 'vue';
import { readonly, ref } from 'vue';

import type { KeyPress } from '@/domain/keyboard/capture';
import { combinationOf, heldKeysOf, heldModifiersOf } from '@/domain/keyboard/capture';
import type { KeyCombination } from '@/domain/keyboard/combination';
import type { Keymap } from '@/domain/keyboard/keymap';

import { useWindowListener } from './useWindowListener';

/**
 * Listens to the keyboard while the calling component lives: reports each combination pressed as
 * an answer, and shows what's held right now. Keys don't reach the webview meanwhile, so
 * practicing ⌘R doesn't reload it. `keymap` is read at each key, so a layout change applies at
 * once. Returns the keys held, named like resolved keys.
 */
export function useKeyCapture(
  keymap: () => Keymap,
  answer: (keys: KeyCombination) => void,
): Readonly<Ref<KeyCombination>> {
  const held = ref<KeyCombination>([]);

  function onKeyDown(event: KeyboardEvent): void {
    event.preventDefault();

    if (event.repeat) {
      return;
    }

    const press = keyPressOf(event);
    const combination = combinationOf(keymap(), press);
    held.value = heldKeysOf(keymap(), press);

    if (combination !== undefined) {
      answer(combination);
    }
  }

  function onKeyUp(event: KeyboardEvent): void {
    held.value = heldModifiersOf(keyPressOf(event));
  }

  function onBlur(): void {
    held.value = [];
  }

  useWindowListener('keydown', onKeyDown);
  useWindowListener('keyup', onKeyUp);
  useWindowListener('blur', onBlur);

  return readonly(held);
}

/** What a keyboard event says about the key and the modifiers held. */
export function keyPressOf(event: KeyboardEvent): KeyPress {
  return {
    code: event.code,
    control: event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey,
    meta: event.metaKey,
  };
}
