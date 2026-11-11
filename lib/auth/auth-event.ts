/**
 * Cross-component auth-state notification.
 *
 * The header (HeaderAuth) fetches the session once on mount. In the Next.js App
 * Router the root layout — and therefore the header — persists across client
 * navigations, so a login/register that only calls router.push/refresh would
 * leave the header showing the stale signed-out state until a full reload.
 *
 * Auth flows that change the session (login, register auto-login) dispatch this
 * event; HeaderAuth listens and re-fetches immediately, so the top-right updates
 * the moment auth succeeds. Client-only (uses window).
 */
export const AUTH_CHANGE_EVENT = "auth-change";

/** Broadcast that auth state changed so listeners (e.g. HeaderAuth) re-fetch. */
export function notifyAuthChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT));
  }
}
