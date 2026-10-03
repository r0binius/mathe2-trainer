import type { Access } from '../shared/access';
import { decodeAccess } from '../shared/access';
import type { Decoder } from '../shared/decode';
import { object, optional, string } from '../shared/decode';

/** The app the user works in, which the popover shows the shortcuts of. */
export type AppInFront = {
  /** Its name in the system's language, such as "Notizen". */
  readonly name: string;
  /** Such as `com.apple.Notes`; missing for a bare executable. */
  readonly bundleId?: string;
};

/** What the popover opens over, which the Rust side tells it every time it opens. */
export type PopoverOpened = {
  /** Missing when no other app has a window. */
  readonly app?: AppInFront;
  /** Whether Mouseless may read other apps' menus (Accessibility). */
  readonly menuAccess: Access;
};

/** Decodes the `popover-opened` event's payload. */
export const decodePopoverOpened: Decoder<PopoverOpened> = object({
  app: optional(object({ name: string, bundleId: optional(string) })),
  menuAccess: decodeAccess,
});
