// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';

import { logPolicyViolations } from './policyViolations';

describe('logPolicyViolations', () => {
  it('logs what the policy blocked and by which directive', () => {
    const logger = { warn: vi.fn(), error: vi.fn() };
    logPolicyViolations(logger);

    const violation = Object.assign(new Event('securitypolicyviolation'), {
      blockedURI: 'https://example.com/font.woff2',
      effectiveDirective: 'font-src',
    });
    document.dispatchEvent(violation);

    expect(logger.error).toHaveBeenCalledWith(
      'The content security policy blocked https://example.com/font.woff2 (font-src)',
    );
  });
});
