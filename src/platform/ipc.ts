import type { DecodeError, Decoder } from '@/domain/shared/decode';
import { literal, object, oneOf, string } from '@/domain/shared/decode';
import type { PlatformError } from '@/domain/shared/platformError';
import type { Result } from '@/domain/shared/result';
import { err, ok } from '@/domain/shared/result';

/** Arguments of a command, by the names of its Rust parameters in camelCase. */
export type CommandArgs = Readonly<Record<string, unknown>>;

/**
 * Tauri's `invoke`, passed in rather than imported, so the code using it can be tested without
 * Tauri.
 */
export type Invoke = (command: string, args?: CommandArgs) => Promise<unknown>;

/** An event from the Rust side, as Tauri's `listen` hands it over: its payload not yet decoded. */
export type ReceivedEvent = { readonly payload: unknown };

/**
 * Tauri's `listen`, passed in like {@link Invoke}. It resolves to the function that stops
 * listening.
 */
export type Listen = (
  event: string,
  handler: (received: ReceivedEvent) => void,
) => Promise<() => void>;

/** Invokes a command and decodes its answer. It never rejects: every failure is a result. */
export type CommandCall = <T>(
  command: string,
  decoder: Decoder<T>,
  args?: CommandArgs,
) => Promise<Result<T, PlatformError>>;

/** How the Rust side sends an `AppError`. */
const decodeAppError = object({
  kind: oneOf([
    literal('storage'),
    literal('database'),
    literal('keymap'),
    literal('trigger'),
    literal('lookup'),
    literal('window'),
  ]),
  message: string,
});

/** Decodes the `null` that a command without a result answers with. */
export function nothing(input: unknown): Result<void, DecodeError> {
  return input === null ? ok(undefined) : err({ path: '', expected: 'nothing' });
}

/** Builds the {@link CommandCall} that the repositories use to reach the Rust side. */
export function commandCaller(invoke: Invoke): CommandCall {
  return async function call(command, decoder, args) {
    const answer = await invoke(command, args).then(
      (response) => ok(response),
      (error: unknown) => err(platformErrorOf(error)),
    );

    return answer.kind === 'ok' ? decodeAnswer(command, decoder, answer.value) : answer;
  };
}

function decodeAnswer<T>(
  command: string,
  decoder: Decoder<T>,
  response: unknown,
): Result<T, PlatformError> {
  const decoded = decoder(response);

  if (decoded.kind === 'ok') {
    return decoded;
  }

  const { path, expected } = decoded.error;
  const where = path === '' ? command : `${command}: ${path}`;

  return err({ kind: 'invalidResponse', message: `${where}: expected ${expected}` });
}

/** The command's own error, or a failed call when Tauri rejected it before the command ran. */
function platformErrorOf(error: unknown): PlatformError {
  const appError = decodeAppError(error);

  return appError.kind === 'ok' ? appError.value : { kind: 'ipc', message: String(error) };
}

/**
 * Builds the function that calls a listener on every `event` from the Rust side, until the
 * returned function stops it. It never rejects, like {@link commandCaller}: if listening fails,
 * `onFailure` gets the reason, and stopping does nothing.
 */
export function subscriber(
  listen: Listen,
  event: string,
  onFailure: (message: string) => void,
): (listener: (received: ReceivedEvent) => void) => () => void {
  return function subscribe(listener) {
    const listening = listen(event, listener).then(ok, (error: unknown) => {
      onFailure(String(error));
      return err(String(error));
    });

    return () => {
      void listening.then(stopListening);
    };
  };
}

/**
 * Turns a {@link subscriber}'s listeners into listeners of the decoded payload. A payload that
 * doesn't decode goes to `onInvalid` instead of the listener.
 */
export function decodingPayloads<T>(
  subscribe: (listener: (received: ReceivedEvent) => void) => () => void,
  decoder: Decoder<T>,
  onInvalid: (message: string) => void,
): (listener: (payload: T) => void) => () => void {
  return function subscribeToPayload(listener) {
    return subscribe(({ payload }) => {
      const decoded = decoder(payload);

      if (decoded.kind === 'ok') {
        listener(decoded.value);
      } else {
        const { path, expected } = decoded.error;
        onInvalid(`${path === '' ? 'payload' : path}: expected ${expected}`);
      }
    });
  };
}

/** Stops listening, if listening started. */
function stopListening(listened: Result<() => void, string>): void {
  switch (listened.kind) {
    case 'ok':
      listened.value();
      return;
    case 'err':
      return;
  }
}
