import type { Ref } from 'vue';
import { readonly, ref, watch } from 'vue';

import { useWindowListener } from '@/composables/useWindowListener';
import type { CoachAccess, Permission } from '@/domain/settings/coachAccess';
import type { CoachPermissions, Logger } from '@/ports';

/**
 * What learning from how the user works needs them to allow, while `enabled` says it's on: asked
 * when it turns on, and again whenever the window gains focus, since the user allows it in System
 * Settings. Asking also lets the Rust side start watching once both are allowed. Returns the
 * access, unknown until the first answer, and how to open System Settings for a permission.
 */
export function useCoachAccess(
  port: CoachPermissions,
  enabled: () => boolean,
  logger: Logger,
): readonly [
  access: Readonly<Ref<CoachAccess | undefined>>,
  askFor: (permission: Permission) => void,
] {
  const access = ref<CoachAccess>();

  async function load(): Promise<void> {
    const loaded = await port.load();

    if (loaded.kind === 'ok') {
      access.value = loaded.value;
    } else {
      logger.error(`Could not ask what learning from work may watch: ${loaded.error.message}`);
    }
  }

  function loadWhileEnabled(): void {
    if (enabled()) {
      void load();
    }
  }

  async function ask(permission: Permission): Promise<void> {
    const asked = await port.askFor(permission);

    if (asked.kind === 'err') {
      logger.error(`Could not open System Settings: ${asked.error.message}`);
    }
  }

  watch(enabled, loadWhileEnabled, { immediate: true });
  useWindowListener('focus', loadWhileEnabled);

  return [
    readonly(access),
    (permission) => {
      void ask(permission);
    },
  ];
}
