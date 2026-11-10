/**
 * A processing error carrying a stable i18n `code` + `params`, so the UI can
 * render a localized message without parsing English text. Thrown by decode
 * for pixel-limit violations and caught/translated in the workspace hook
 * (SPEC V2 Step 1.3 error-message localization).
 */
export class ProcessingError extends Error {
  readonly code: string;
  readonly params?: Record<string, string | number>;
  constructor(code: string, message: string, params?: Record<string, string | number>) {
    super(message);
    this.name = "ProcessingError";
    this.code = code;
    this.params = params;
  }
}
