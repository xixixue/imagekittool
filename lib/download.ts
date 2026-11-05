/**
 * Trigger a browser download for a Blob without any server round-trip.
 * The image content never leaves the browser.
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoke after the download has started.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
