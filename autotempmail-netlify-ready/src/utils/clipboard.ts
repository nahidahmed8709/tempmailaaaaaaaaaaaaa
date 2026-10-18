/**
 * Bulletproof Clipboard Utility
 * Handles "Document is not focused" and "Write permission denied" errors gracefully
 * with execCommand textarea fallback and silent error handling.
 */

export async function safeWriteClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. Try modern Clipboard API if document is focused
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    try {
      // Check if document has focus to avoid "Document is not focused" error
      const isFocused = typeof document !== 'undefined' && typeof document.hasFocus === 'function' ? document.hasFocus() : true;
      if (isFocused) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (apiErr) {
      // Fall through to fallback
      console.debug('navigator.clipboard.writeText failed or blocked:', apiErr);
    }
  }

  // 2. Fallback: document.execCommand('copy') via off-screen textarea
  if (typeof document !== 'undefined' && document.body) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus({ preventScroll: true });
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (successful) {
        return true;
      }
    } catch (fallbackErr) {
      console.debug('execCommand copy fallback failed:', fallbackErr);
    }
  }

  // 3. Last-ditch attempt if not focused but API might still succeed
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}
