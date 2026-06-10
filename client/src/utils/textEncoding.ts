export function fixUtf8Mojibake(input: string): string {
  if (!input) return input;

  const likelyMojibake = /[Ã]/.test(input);
  if (!likelyMojibake) return input;

  try {
    const bytes = new Uint8Array(input.length);
    for (let i = 0; i < input.length; i++) {
      bytes[i] = input.charCodeAt(i) & 0xff;
    }
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);

    return decoded && decoded !== input ? decoded : input;
  } catch {
    return input;
  }
}

export function fixUtf8MojibakeDeep<T>(value: T): T {
  if (typeof value === 'string') {
    return fixUtf8Mojibake(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((v) => fixUtf8MojibakeDeep(v)) as T;
  }

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = fixUtf8MojibakeDeep(v);
    }
    return out as T;
  }

  return value;
}
