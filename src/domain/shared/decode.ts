import type { Err, Ok, Result } from './result';
import { err, ok } from './result';

/** Why data from outside couldn't be decoded: where in it, and what was expected there. */
export type DecodeError = {
  /** Where in the input, such as `sets[3].progress.learned`, or `''` for the input itself. */
  readonly path: string;
  readonly expected: string;
};

/**
 * Turns untrusted data, such as JSON from IPC, into a typed value, or says why it can't. Small
 * decoders compose into larger ones, as in Elm's `Json.Decode`, so a decoder reads like its type.
 * @see {@link https://package.elm-lang.org/packages/elm/json/latest/Json-Decode | Json.Decode}
 */
export type Decoder<T> = (input: unknown) => Result<T, DecodeError>;

/** A field of an {@link object} that may be missing. The decoded object leaves it out then. */
export type Optional<T> = { readonly optional: Decoder<T> };

type Field = Decoder<unknown> | Optional<unknown>;

type Shape = Readonly<Record<string, Field>>;

type OptionalKeys<S extends Shape> = {
  [K in keyof S]: S[K] extends Optional<unknown> ? K : never;
}[keyof S];

type DecodedField<F> = F extends Optional<infer T> ? T : F extends Decoder<infer T> ? T : never;

/** The object an {@link object} decoder with the given fields returns. */
export type Decoded<S extends Shape> = {
  readonly [K in Exclude<keyof S, OptionalKeys<S>>]: DecodedField<S[K]>;
} & {
  readonly [K in OptionalKeys<S>]?: DecodedField<S[K]>;
};

/** What a {@link sift} decoder returns: the items that decode, and why the others don't. */
export type Sifted<T> = {
  readonly valid: readonly T[];
  readonly invalid: readonly DecodeError[];
};

type Entry = readonly [string, unknown];

/** Decodes a string. */
export function string(input: unknown): Result<string, DecodeError> {
  return typeof input === 'string' ? ok(input) : fail('a string');
}

/** Decodes a boolean. */
export function boolean(input: unknown): Result<boolean, DecodeError> {
  return typeof input === 'boolean' ? ok(input) : fail('a boolean');
}

/** Decodes a finite number. */
export function number(input: unknown): Result<number, DecodeError> {
  return typeof input === 'number' && Number.isFinite(input) ? ok(input) : fail('a finite number');
}

/** Decodes a whole number that's exact as a JavaScript number, such as a time in milliseconds. */
export function integer(input: unknown): Result<number, DecodeError> {
  return typeof input === 'number' && Number.isSafeInteger(input) ? ok(input) : fail('an integer');
}

/** Decodes exactly `value`, such as the `kind` of a union's member. */
export function literal<const T extends string>(value: T): Decoder<T> {
  return function decodeLiteral(input) {
    return input === value ? ok(value) : fail(JSON.stringify(value));
  };
}

/** Decodes an array whose items all decode. The first item that doesn't fails the array. */
export function array<T>(item: Decoder<T>): Decoder<readonly T[]> {
  return function decodeArray(input) {
    return isArray(input) ? all(decodeItems(input, item)) : fail('an array');
  };
}

/**
 * Decodes an array, keeping the items that decode and reporting the others, so one bad item
 * doesn't lose the rest. Only input that isn't an array fails.
 */
export function sift<T>(item: Decoder<T>): Decoder<Sifted<T>> {
  return function decodeSifted(input) {
    if (!isArray(input)) {
      return fail('an array');
    }

    const results = decodeItems(input, item);

    return ok({ valid: results.flatMap(valueOf), invalid: results.flatMap(errorOf) });
  };
}

/** Marks a field of an {@link object} as one that may be missing. */
export function optional<T>(decoder: Decoder<T>): Optional<T> {
  return { optional: decoder };
}

/**
 * Decodes an object with the given fields. Only these fields are returned, so extra properties of
 * the input don't leak through. A field that fails, fails the object.
 * @example
 * ```ts
 * const decodeProgress = object({ learned: array(string), completedAt: optional(integer) });
 * ```
 */
export function object<S extends Shape>(shape: S): Decoder<Decoded<S>> {
  return function decodeObject(input) {
    if (!isRecord(input)) {
      return fail('an object');
    }

    const fields = all(Object.entries(shape).map(([key, field]) => decodeField(input, key, field)));

    // Built from the shape's own keys, each by its own decoder: exactly what `Decoded<S>` describes.
    return fields.kind === 'ok'
      ? ok(Object.fromEntries(fields.value.flat()) as Decoded<S>)
      : fields;
  };
}

/**
 * Decodes an object whose properties are some of `keys`, each decoded by `item`, such as a keymap
 * by key code. Missing keys are left out, and so are properties that aren't in `keys`.
 */
export function partialRecord<K extends string, T>(
  keys: readonly K[],
  item: Decoder<T>,
): Decoder<Readonly<Partial<Record<K, T>>>> {
  const shape = Object.fromEntries(keys.map((key) => [key, optional(item)]));

  // `fromEntries` types its keys as `string`, but they're exactly `keys`, each optional `item`.
  return object(shape) as Decoder<Readonly<Partial<Record<K, T>>>>;
}

/**
 * Decodes an object used as a dictionary: whatever its keys are, each property is decoded by
 * `item`. Properties that don't decode are left out, so one bad entry doesn't lose the rest.
 */
export function dictionary<T>(item: Decoder<T>): Decoder<Readonly<Partial<Record<string, T>>>> {
  return function decodeDictionary(input) {
    return isRecord(input)
      ? ok(
          Object.fromEntries(
            Object.entries(input).flatMap(([key, value]) =>
              valueOf(item(value)).map((decoded) => [key, decoded] as const),
            ),
          ),
        )
      : fail('an object');
  };
}

/**
 * Decodes with the first decoder that succeeds, such as for a union's members. If none does, the
 * failure that got furthest into the input is the most telling, so that one is reported.
 */
export function oneOf<T extends readonly unknown[]>(decoders: {
  readonly [K in keyof T]: Decoder<T[K]>;
}): Decoder<T[number]> {
  return function decodeOneOf(input) {
    const results = decoders.map((decoder) => decoder(input));
    const success = results.find(isOk);

    return (
      success ??
      err(
        results.flatMap(errorOf).reduce<DecodeError | undefined>(furthest, undefined) ?? noDecoder,
      )
    );
  };
}

/** Decodes, then transforms the decoded value. */
export function map<T, U>(decoder: Decoder<T>, transform: (value: T) => U): Decoder<U> {
  return function decodeMapped(input) {
    const decoded = decoder(input);

    return decoded.kind === 'ok' ? ok(transform(decoded.value)) : decoded;
  };
}

/** Decodes, then checks the decoded value further, such as with a domain parser. */
export function andThen<T, U>(
  decoder: Decoder<T>,
  next: (value: T) => Result<U, DecodeError>,
): Decoder<U> {
  return function decodeThen(input) {
    const decoded = decoder(input);

    return decoded.kind === 'ok' ? next(decoded.value) : decoded;
  };
}

/** Puts a field name or an index (`[2]`) in front of an error's path. */
export function at(segment: string, { path, expected }: DecodeError): DecodeError {
  const separator = path === '' || path.startsWith('[') ? '' : '.';

  return { path: `${segment}${separator}${path}`, expected };
}

/** What an empty {@link oneOf} reports: without a decoder, nothing decodes. */
const noDecoder: DecodeError = { path: '', expected: 'one of no decoders' };

function fail(expected: string): Err<DecodeError> {
  return err({ path: '', expected });
}

function isRecord(input: unknown): input is Readonly<Record<string, unknown>> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function isArray(input: unknown): input is readonly unknown[] {
  return Array.isArray(input);
}

function isOk<T>(result: Result<T, DecodeError>): result is Ok<T> {
  return result.kind === 'ok';
}

function valueOf<T>(result: Result<T, DecodeError>): readonly T[] {
  return result.kind === 'ok' ? [result.value] : [];
}

function errorOf<T>(result: Result<T, DecodeError>): readonly DecodeError[] {
  return result.kind === 'err' ? [result.error] : [];
}

/** The error that got further into the input, the earlier one of equals. */
function furthest(found: DecodeError | undefined, error: DecodeError): DecodeError {
  return found === undefined || error.path.length > found.path.length ? error : found;
}

/** The first failure, or all values. */
function all<T>(results: readonly Result<T, DecodeError>[]): Result<readonly T[], DecodeError> {
  const [failure] = results.flatMap(errorOf);

  return failure === undefined ? ok(results.flatMap(valueOf)) : err(failure);
}

function decodeItems<T>(
  items: readonly unknown[],
  item: Decoder<T>,
): readonly Result<T, DecodeError>[] {
  return items.map((value, index) => within(`[${String(index)}]`, item(value)));
}

/** A field's entry for the decoded object: none for a missing optional field. */
function decodeField(
  input: Readonly<Record<string, unknown>>,
  key: string,
  field: Field,
): Result<readonly Entry[], DecodeError> {
  // `hasOwn`, so a key such as `constructor` doesn't find Object's.
  const value = Object.hasOwn(input, key) ? input[key] : undefined;
  const decoder = typeof field === 'function' ? field : field.optional;

  if (typeof field !== 'function' && value === undefined) {
    return ok([]);
  }

  const decoded = within(key, decoder(value));

  return decoded.kind === 'ok' ? ok([[key, decoded.value]]) : decoded;
}

function within<T>(segment: string, result: Result<T, DecodeError>): Result<T, DecodeError> {
  return result.kind === 'ok' ? result : err(at(segment, result.error));
}
