export function parseDateOnly(value: Date | string | null | undefined): Date {
  if (!value) return new Date(NaN);

  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const raw = String(value).trim();

  // YYYY-MM-DD (date-only) must be parsed as LOCAL date to avoid timezone shifting.
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split('-').map((n) => parseInt(n, 10));
    return new Date(y, (m || 1) - 1, d || 1);
  }

  // Fallback: let JS parse and then normalize to local date.
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return parsed;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

export function formatDateOnlyPtBr(value: Date | string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  const dt = parseDateOnly(value);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString('pt-BR', opts);
}

export function isDateOnlyUpcoming(value: Date | string | null | undefined): boolean {
  const dt = parseDateOnly(value);
  if (Number.isNaN(dt.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dt.getTime() >= today.getTime();
}

export function isDateOnlyThisMonth(value: Date | string | null | undefined): boolean {
  const dt = parseDateOnly(value);
  if (Number.isNaN(dt.getTime())) return false;
  const today = new Date();
  return dt.getMonth() === today.getMonth() && dt.getFullYear() === today.getFullYear();
}
