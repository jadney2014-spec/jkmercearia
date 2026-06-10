export function normalizeText(value: string): string {
  if (!value) return '';

  return value
    .replace(/^\uFEFF/, '')
    .replace(/\uFFFD/g, '')
    .normalize('NFC');
}
