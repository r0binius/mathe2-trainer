// Vite turns each logo into a URL; the path's folder is the app's ID (checked by the health test).
const logos = import.meta.glob<string>('../../data/apps/*/logo.svg', {
  eager: true,
  import: 'default',
});

/** The URL of an app's logo, or `undefined` for an app without one. */
export function logoOf(appId: string): string | undefined {
  return logos[`../../data/apps/${appId}/logo.svg`];
}
