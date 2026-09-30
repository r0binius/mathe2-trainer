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
 * then opens the focused link. A screen without `back` has nowhere to go. The screen's first
 * focusable element, its main action, gets focus when it opens, unless focus is elsewhere.
 */
export function useSpatialNav(root: () => HTMLElement | null, back?: () => void): void {
  function focusables(): readonly HTMLElement[] {
    return [...(root()?.querySelectorAll<HTMLElement>(focusableSelector) ?? [])];
  }

  function focusFirst(): void {
    focusFirstIn(root());
  }

  /** Focuses the page's main action when it opens, unless focus is elsewhere, such as the sidebar. */
  function focusFirstOnOpen(): void {
    if (ownsFocus(root())) {
      focusFirst();
    }
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

  onMounted(focusFirstOnOpen);
  window.addEventListener('keydown', onKeyDown);
  onScopeDispose(() => {
    window.removeEventListener('keydown', onKeyDown);
  });
}

/** Focuses the first link, button or menu inside `root`, if it has one. */
export function focusFirstIn(root: HTMLElement | null): void {
  root?.querySelector<HTMLElement>(focusableSelector)?.focus();
}

/** A key pressed on its own, which nothing else has handled already. */
function isPlainKey(event: KeyboardEvent): boolean {
  return !event.defaultPrevented && !event.metaKey && !event.ctrlKey && !event.altKey;
}

/**
 * Whether keys are this screen's to handle: focus is inside it, or nowhere. Keys in the sidebar
 * are the sidebar's.
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
