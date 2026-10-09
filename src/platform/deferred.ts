/** Sends the newest of the values it is given, at most once per interval, and when told to. */
export type Deferred<Value> = {
  /** Remembers the value as the one to send next, and starts the interval if none is running. */
  readonly schedule: (value: Value) => void;
  /** Sends the newest unsent value now, if there is one. Never throws. */
  readonly flush: () => Promise<void>;
};

/**
 * Collects changes and sends only the latest: a learner who answers fifty cards in ten minutes
 * costs one request, not fifty. The interval does not restart with each value, so steady activity
 * still gets through every `intervalMs`. A value that could not be sent is tried again after the
 * next interval, unless a newer one replaced it.
 */
export function deferred<Value>(
  send: (value: Value) => Promise<boolean>,
  intervalMs: number,
): Deferred<Value> {
  /* eslint-disable functional/no-let -- the unsent value and the running timer are the state */
  let unsent: { readonly value: Value } | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let sending: Promise<void> = Promise.resolve();
  /* eslint-enable functional/no-let */

  function arm(): void {
    timer ??= setTimeout(() => {
      void flush();
    }, intervalMs);
  }

  function flush(): Promise<void> {
    clearTimeout(timer);
    timer = undefined;

    // One request at a time, so an older value never lands after a newer one.
    sending = sending.then(async () => {
      const next = unsent;
      unsent = undefined;

      if (next === undefined) {
        return;
      }

      const sent = await send(next.value).catch(() => false);

      if (!sent) {
        unsent ??= next;
        arm();
      }
    });

    return sending;
  }

  return {
    schedule: (value) => {
      unsent = { value };
      arm();
    },
    flush,
  };
}
