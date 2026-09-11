/**
 * Minimal markdown for short YAML strings (process steps etc.):
 * escapes HTML, then supports **bold** and paragraph breaks.
 */
export function mdLite(text: string): string {
  const escaped = text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
  return escaped
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>`)
    .join('');
}
