import { describe, expect, it, vi } from 'vitest';
import { effectScope } from 'vue';

import type { Program } from './useProgram';
import { useProgram } from './useProgram';

type Msg =
  { readonly type: 'add'; readonly n: number } | { readonly type: 'addLater'; readonly n: number };
type Effect = { readonly type: 'send'; readonly msg: Msg };

/** A counter: `add` adds, and `addLater` asks the shell to send an `add` back. */
const counter: Program<number, Msg, Effect> = {
  update: (model, msg) => {
    switch (msg.type) {
      case 'add':
        return { model: model + msg.n, effects: [] };
      case 'addLater':
        return { model, effects: [{ type: 'send', msg: { type: 'add', n: msg.n } }] };
    }
  },
  run: (effect, dispatch) => {
    dispatch(effect.msg);
  },
};

/** Runs the program from 0 in its own scope, as a component would. */
function start(program: Program<number, Msg, Effect>) {
  const scope = effectScope();
  const running = scope.run(() => useProgram(0, program));

  if (running === undefined) {
    return expect.unreachable();
  }

  const [model, dispatch] = running;

  return {
    model,
    dispatch,
    stop: () => {
      scope.stop();
    },
  };
}

describe('useProgram', () => {
  it('starts with the initial model', () => {
    expect(start(counter).model.value).toBe(0);
  });

  it('updates the model with each message', () => {
    const { model, dispatch } = start(counter);

    dispatch({ type: 'add', n: 2 });
    dispatch({ type: 'add', n: 3 });

    expect(model.value).toBe(5);
  });

  it('runs the effects of an update, and feeds the messages they send back in', () => {
    const { model, dispatch } = start(counter);

    dispatch({ type: 'addLater', n: 4 });

    expect(model.value).toBe(4);
  });

  it('hands effects the model they were computed with, already shown', () => {
    const seen = vi.fn();
    const { model, dispatch } = start({
      update: (current, msg) => ({ model: current + msg.n, effects: [{ type: 'send', msg }] }),
      run: () => {
        seen(model.value);
      },
    });

    dispatch({ type: 'add', n: 1 });

    expect(seen).toHaveBeenCalledWith(1);
  });

  it('aborts running effects and ignores their messages once its scope ends', () => {
    vi.useFakeTimers();
    const aborted = vi.fn();
    const { model, dispatch, stop } = start({
      ...counter,
      run: (effect, send, signal) => {
        signal.addEventListener('abort', aborted);
        setTimeout(() => {
          send(effect.msg);
        }, 1000);
      },
    });

    dispatch({ type: 'addLater', n: 4 });
    stop();
    vi.runAllTimers();
    vi.useRealTimers();

    expect(aborted).toHaveBeenCalledOnce();
    expect(model.value).toBe(0);
  });
});
