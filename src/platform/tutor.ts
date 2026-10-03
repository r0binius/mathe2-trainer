/** Asks Claude a question; `onText` gets the whole answer so far while it's written. */
export type Tutor = (prompt: string, onText: (text: string) => void) => Promise<string>;

type Sample = (
  input: string,
  options: { readonly onText: (update: { readonly text: string }) => void },
) => Promise<{ readonly text: string }>;

type Runtime = { readonly use: (name: string) => Promise<unknown> };

/**
 * The tutor, where the page runs as a published artifact, or `undefined` elsewhere. Each question
 * uses the viewer's own Claude account, so it's only ever asked on a click.
 */
export async function findTutor(): Promise<Tutor | undefined> {
  const runtime = (window as unknown as { readonly claude?: Runtime }).claude;

  if (runtime === undefined) {
    return undefined;
  }

  try {
    const sample = (await runtime.use('sample')) as Sample | null;

    return sample === null
      ? undefined
      : async (prompt, onText) =>
          (
            await sample(prompt, {
              onText: ({ text }) => {
                onText(text);
              },
            })
          ).text;
  } catch {
    return undefined;
  }
}
