import { describe, expect, it, vi } from 'vitest';

import { integer } from '@/domain/shared/decode';
import { err, ok } from '@/domain/shared/result';

import type { ReceivedEvent } from './ipc';
import { commandCaller, decodingPayloads, nothing } from './ipc';

describe('commandCaller', () => {
  it('invokes the command with its arguments and decodes the answer', async () => {
    const invoke = vi.fn(() => Promise.resolve(42));

    await expect(
      commandCaller(invoke)('answer', integer, { question: 'all' }),
    ).resolves.toStrictEqual(ok(42));
    expect(invoke).toHaveBeenCalledWith('answer', { question: 'all' });
  });

  it('reports an answer that does not decode, with where and why', async () => {
    const invoke = vi.fn(() => Promise.resolve('42'));

    await expect(commandCaller(invoke)('answer', integer)).resolves.toStrictEqual(
      err({ kind: 'invalidResponse', message: 'answer: expected an integer' }),
    );
  });

  // Tauri rejects with what the command returned, or with a message, never with an `Error`.
  it.each([
    { kind: 'database', message: 'database is locked' },
    { kind: 'keymap', message: 'no keyboard layout is selected' },
  ])('passes on the $kind error a command returned', async (error) => {
    const invoke = vi.fn().mockRejectedValue(error);

    await expect(commandCaller(invoke)('answer', integer)).resolves.toStrictEqual(err(error));
  });

  it('reports a failed call, such as arguments the command rejects', async () => {
    const invoke = vi.fn().mockRejectedValue('invalid args `settings` for command `set_settings`');

    await expect(commandCaller(invoke)('set_settings', nothing)).resolves.toStrictEqual(
      err({ kind: 'ipc', message: 'invalid args `settings` for command `set_settings`' }),
    );
  });
});

describe('nothing', () => {
  it('decodes the null a command without a result answers with', () => {
    expect(nothing(null)).toStrictEqual(ok(undefined));
    expect(nothing(0)).toStrictEqual(err({ path: '', expected: 'nothing' }));
  });
});

describe('decodingPayloads', () => {
  function sending(payload: unknown) {
    return (listener: (received: ReceivedEvent) => void) => {
      listener({ payload });
      return vi.fn();
    };
  }

  it('calls the listener with the decoded payload', () => {
    const listener = vi.fn();

    decodingPayloads(sending(42), integer, vi.fn())(listener);

    expect(listener).toHaveBeenCalledWith(42);
  });

  it('reports a payload that does not decode, and leaves the listener out', () => {
    const listener = vi.fn();
    const onInvalid = vi.fn();

    decodingPayloads(sending('42'), integer, onInvalid)(listener);

    expect(onInvalid).toHaveBeenCalledWith('payload: expected an integer');
    expect(listener).not.toHaveBeenCalled();
  });
});
