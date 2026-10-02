import { onScopeDispose } from 'vue';

/**
 * Calls `listener` on every `type` event of the window while the calling component (or effect
 * scope) lives, and stops with it.
 */
export function useWindowListener<Type extends keyof WindowEventMap>(
  type: Type,
  listener: (event: WindowEventMap[Type]) => void,
  options?: AddEventListenerOptions,
): void {
  window.addEventListener(type, listener, options);

  // Removing only matches a listener added with the same `capture` flag, so it gets the options too.
  onScopeDispose(() => {
    window.removeEventListener(type, listener, options);
  });
}
