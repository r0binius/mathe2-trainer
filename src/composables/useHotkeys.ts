import { onScopeDispose } from 'vue';

/** What each key does, by its name: `Space`, `Enter`, `Escape`, or the lower-case character. */
export type Hotkeys = Readonly<Partial<Record<string, () => void>>>;

function nameOf(event: KeyboardEvent): string {
  if (event.key === ' ') {
    return 'Space';
  }

  return event.key.length === 1 ? event.key.toLowerCase() : event.key;
}

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')
  );
}

/**
 * Runs the handler of every key pressed while the calling component lives, so the trainer works
 * without a mouse. Keys typed into a field are left to the field, except Escape, and so are keys
 * pressed with a modifier, which belong to the browser.
 */
export function useHotkeys(hotkeys: () => Hotkeys): void {
  function onKeydown(event: KeyboardEvent): void {
    const name = nameOf(event);
    const handler = hotkeys()[name];
    const blocked =
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      (isTyping(event.target) && name !== 'Escape');

    if (handler !== undefined && !blocked) {
      event.preventDefault();
      handler();
    }
  }

  window.addEventListener('keydown', onKeydown);
  onScopeDispose(() => {
    window.removeEventListener('keydown', onKeydown);
  });
}
