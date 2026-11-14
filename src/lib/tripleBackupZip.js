/**
 * Opens the archive for the A1 release source branch.
 * This is a source-code archive only, not a live database or secret backup.
 */
export async function generateTripleBackupZip() {
  const url = 'https://github.com/roohalla41-blip/-1/archive/refs/heads/release/restore-build.zip';
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.download = 'hesab-sarraf-release-restore-build.zip';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  return 'آرشیو سورس در تب جدید باز شد؛ دانلود را در مرورگر بررسی کنید.';
}
