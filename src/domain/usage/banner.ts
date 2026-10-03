import type { KeyCombination } from '../keyboard/combination';
import type { Decoder } from '../shared/decode';
import { array, object, string } from '../shared/decode';

/** What the banner shows after a menu choice: the shortcut's title, translated, and its keys. */
export type Banner = {
  readonly title: string;
  readonly keys: KeyCombination;
};

/** Decodes the `banner-shown` event's payload. */
export const decodeBanner: Decoder<Banner> = object({ title: string, keys: array(string) });
