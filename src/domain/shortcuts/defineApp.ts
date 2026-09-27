import type { AppDefinition } from './types';

/**
 * Declares an app's shortcuts, so that its data file is type-checked and autocompleted.
 *
 * It returns the definition unchanged. Rules that types can't express, such as unique IDs, keys
 * that exist and message keys that are in the catalog, are checked by the data health test.
 * @example
 * ```ts
 * export const rectangle = defineApp({
 *   id: 'rectangle',
 *   title: 'Rectangle',
 *   category: 'system',
 *   sets: [
 *     {
 *       id: 'halves',
 *       title: 'halves.title',
 *       shortcuts: [{ title: 'halves.left', keys: [['Control', 'Alt', 'ArrowLeft']] }],
 *     },
 *   ],
 * });
 * ```
 */
export function defineApp(app: AppDefinition): AppDefinition {
  return app;
}
