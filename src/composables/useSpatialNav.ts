import { onMounted, onScopeDispose } from 'vue';

import type { Box, Direction } from './spatial';
import { nearestInDirection } from './spatial';

const focusableSelector = 'a[href], button:not(:disabled), select:not(:disabled)';

const directions: Readonly<Record<string, Direction>> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

/**
 * Keyboard navigation for a screen while it lives: the arrow keys move focus to the nearest
 * element that way, Escape goes `back`, and so does ← once nothing lies to the left, while →
 * then opens the focused link. A screen without `back`, such as the library, has nowhere to go. The screen's first focusable element, its main action, gets focus
 * when it opens.
 */
export function useSpatialNav(root: () => HTMLElement | null, back?: () => void): void {
  function focusables(): readonly HTMLElement[] {
    return [...(root()?.querySelectorAll<HTMLElement>(focusableSelector) ?? [])];
  }

  function focusFirst(): void {
    // Without scrolling, which would fight the slide of a screen that's still moving in.
    focusables()[0]?.focus({ preventScroll: true });
  }

  function move(direction: Direction): void {
    const items = focusables();
    const current = items.find((item) => item === document.activeElement);

    if (current === undefined) {
      focusFirst();
      return;
    }

    const index = nearestInDirection(boxOf(current), items.map(boxOf), direction);
    const next = index === undefined ? undefined : items[index];

    if (next !== undefined) {
      next.focus();
    } else if (direction === 'left') {
      back?.();
    } else if (direction === 'right' && current instanceof HTMLAnchorElement) {
      current.click();
    }
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (!isPlainKey(event) || !ownsFocus(root())) {
      return;
    }

    const direction = directions[event.key];

    if (event.key === 'Escape' && back !== undefined) {
      event.preventDefault();
      back();
    } else if (direction !== undefined) {
      event.preventDefault();
      move(direction);
    }
  }

  onMounted(focusFirst);
  window.addEventListener('keydown', onKeyDown);
  onScopeDispose(() => {
    window.removeEventListener('keydown', onKeyDown);
  });
}

/** A key pressed on its own, which nothing else has handled already. */
function isPlainKey(event: KeyboardEvent): boolean {
  return !event.defaultPrevented && !event.metaKey && !event.ctrlKey && !event.altKey;
}

/**
 * Whether keys are this screen's to handle: focus is inside it, or nowhere. While screens slide,
 * the leaving one still listens, and this keeps it from acting.
 */
function ownsFocus(container: HTMLElement | null): boolean {
  const active = document.activeElement;

  return (
    container !== null &&
    (active === null || active === document.body || container.contains(active))
  );
}

function boxOf(element: HTMLElement): Box {
  return element.getBoundingClientRect();
}
