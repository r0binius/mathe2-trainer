import type { InjectionKey } from 'vue';

/** Moves focus back to the sidebar's selected app, where ← and Escape lead from an app's page. */
export const focusSidebarKey: InjectionKey<() => void> = Symbol('focus sidebar');
