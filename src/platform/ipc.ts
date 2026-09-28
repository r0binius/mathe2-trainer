import type { DecodeError, Decoder } from '@/domain/shared/decode';
import { literal, object, oneOf, string } from '@/domain/shared/decode';
import type { Result } from '@/domain/shared/result';
import { err, ok } from '@/domain/shared/result';
import type { StorageError } from '@/domain/shared/storage';

/** Arguments of a command, by the names of its Rust parameters in camelCase. */
export type CommandArgs = Readonly<Record<string, unknown>>;

/**
 * Tauri's `invoke`, passed in rather than imported, so the code using it can be tested without
 * Tauri.
 */
export type Invoke = (command: string, args?: CommandArgs) => Promise<unknown>;

/** Invokes a command and decodes its answer. It never rejects: every failure is a result. */
export type CommandCall = <T>(
  command: string,
  decoder: Decoder<T>,
  args?: CommandArgs,
) => Promise<Result<T, StorageError>>;

/** How the Rust side sends an `AppError`. */
const decodeAppError = object({
  kind: oneOf([literal('storage'), literal('database')]),
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
      (error: unknown) => err(storageErrorOf(error)),
    );

    return answer.kind === 'ok' ? decodeAnswer(command, decoder, answer.value) : answer;
  };
}

function decodeAnswer<T>(
  command: string,
  decoder: Decoder<T>,
  response: unknown,
): Result<T, StorageError> {
  const decoded = decoder(response);

  if (decoded.kind === 'ok') {
    return decoded;
  }

  const { path, expected } = decoded.error;
  const where = path === '' ? command : `${command}: ${path}`;

  return err({ kind: 'invalidResponse', message: `${where}: expected ${expected}` });
}

/** The command's own error, or a failed call when Tauri rejected it before the command ran. */
function storageErrorOf(error: unknown): StorageError {
  const appError = decodeAppError(error);

  return appError.kind === 'ok' ? appError.value : { kind: 'ipc', message: String(error) };
}
