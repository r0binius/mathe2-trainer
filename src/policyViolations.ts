import type { Logger } from './ports';

/**
 * Logs every request the Content Security Policy blocks, for as long as the page lives. Without
 * this, a blocked font or style only shows in the webview's own console, which a built app hides.
 */
export function logPolicyViolations(logger: Logger): void {
  document.addEventListener('securitypolicyviolation', (event) => {
    logger.error(
      `The content security policy blocked ${event.blockedURI} (${event.effectiveDirective})`,
    );
  });
}
