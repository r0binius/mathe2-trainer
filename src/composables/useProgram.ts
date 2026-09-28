import type { ShallowRef } from 'vue';
import { onScopeDispose, shallowReadonly, shallowRef } from 'vue';

/**
 * A flow in The Elm Architecture: a pure `update` that decides, and `run`, which carries out the
 * effects the update asks for. `run` sends messages back with `dispatch`, and `signal` aborts
 * when the program's component goes away, so a timer can stop and a late result is dropped.
 */
export type Program<Model, Msg, Effect> = {
  readonly update: (
    model: Model,
    msg: Msg,
  ) => { readonly model: Model; readonly effects: readonly Effect[] };
  readonly run: (effect: Effect, dispatch: (msg: Msg) => void, signal: AbortSignal) => void;
};

/**
 * Runs a program from its initial model for as long as the calling component (or effect scope)
 * lives: the Elm runtime. Each message updates the model first, so the effects of an update run
 * with it already shown. Returns the current model to render, and how to send it messages.
 * @see §1.1 of `docs/architecture.md`
 */
export function useProgram<Model, Msg, Effect>(
  init: Model,
  { update, run }: Program<Model, Msg, Effect>,
): readonly [model: Readonly<ShallowRef<Model>>, dispatch: (msg: Msg) => void] {
  const model = shallowRef(init);
  const stopped = new AbortController();

  function dispatch(msg: Msg): void {
    if (stopped.signal.aborted) {
      return;
    }

    const next = update(model.value, msg);
    model.value = next.model;
    next.effects.forEach((effect) => {
      run(effect, dispatch, stopped.signal);
    });
  }

  onScopeDispose(() => {
    stopped.abort();
  });

  return [shallowReadonly(model), dispatch];
}
