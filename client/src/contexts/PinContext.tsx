import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../firebase/AuthContext';
import { db } from '../firebase/config';

type PinMode = 'setup' | 'verify';

interface PinState {
  hasPin: boolean;
  unlocked: boolean;
  expiresAt: number | null;
}

interface PinContextValue extends PinState {
  mode: PinMode;
  setMode: (mode: PinMode) => void;
  unlock: (pin: string) => Promise<boolean>;
  setup: (pin: string) => Promise<void>;
  lock: () => void;
}

const PinContext = createContext<PinContextValue | undefined>(undefined);

const TTL_MS = 10 * 60 * 1000;

const PIN_DOC_PATH = { collection: 'app_settings', doc: 'security' } as const;
const PIN_FIELD = 'pin_hash_v1' as const;
const PIN_CACHE_KEY = 'pin_hash_global_cache_v1' as const;

function sessionKey(userId: string) {
  return `pin_session_v1:${userId}`;
}

async function fetchPinHash(): Promise<string | null> {
  try {
    const ref = doc(db, PIN_DOC_PATH.collection, PIN_DOC_PATH.doc);
    const snap = await getDoc(ref);
    const data = snap.exists() ? snap.data() : undefined;
    const v = data && typeof (data as any)[PIN_FIELD] === 'string' ? String((data as any)[PIN_FIELD]) : null;
    if (v) {
      try {
        localStorage.setItem(PIN_CACHE_KEY, v);
      } catch {
      }
    }
    return v;
  } catch {
    try {
      const cached = localStorage.getItem(PIN_CACHE_KEY);
      return cached || null;
    } catch {
      return null;
    }
  }
}

async function savePinHash(hash: string): Promise<void> {
  const ref = doc(db, PIN_DOC_PATH.collection, PIN_DOC_PATH.doc);
  await setDoc(
    ref,
    {
      [PIN_FIELD]: hash,
      updatedAt: new Date(),
    } as any,
    { merge: true }
  );

  try {
    localStorage.setItem(PIN_CACHE_KEY, hash);
  } catch {
  }
}

async function sha256(input: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const PinProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [mode, setMode] = useState<PinMode>('verify');
  const [hasPin, setHasPin] = useState(false);
  const [pinHash, setPinHash] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  const lock = useCallback(() => {
    if (!user) return;
    try {
      sessionStorage.removeItem(sessionKey(user.uid));
    } catch {
    }
    setExpiresAt(null);
  }, [user]);

  const refreshFromStorage = useCallback(() => {
    if (!user) {
      setHasPin(false);
      setPinHash(null);
      setExpiresAt(null);
      return;
    }

    try {
      const sessionRaw = sessionStorage.getItem(sessionKey(user.uid));
      if (!sessionRaw) {
        setExpiresAt(null);
      } else {
        const session = JSON.parse(sessionRaw) as { expiresAt?: number };
        const exp = typeof session.expiresAt === 'number' ? session.expiresAt : null;
        if (!exp || exp <= Date.now()) {
          setExpiresAt(null);
          sessionStorage.removeItem(sessionKey(user.uid));
        } else {
          setExpiresAt(exp);
        }
      }
    } catch {
      setHasPin(false);
      setPinHash(null);
      setExpiresAt(null);
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;
    if (!user) {
      setHasPin(false);
      setPinHash(null);
      return;
    }

    fetchPinHash()
      .then((hash) => {
        if (!mounted) return;
        setPinHash(hash);
        setHasPin(!!hash);
      })
      .catch(() => {
        if (!mounted) return;
        setPinHash(null);
        setHasPin(false);
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    refreshFromStorage();
  }, [refreshFromStorage]);

  useEffect(() => {
    if (!expiresAt) return;
    const t = window.setInterval(() => {
      if (expiresAt <= Date.now()) {
        lock();
      }
    }, 1000);
    return () => window.clearInterval(t);
  }, [expiresAt, lock]);

  const setup = useCallback(
    async (pin: string) => {
      if (!user) return;
      const hash = await sha256(pin);
      await savePinHash(hash);
      setPinHash(hash);
      setHasPin(true);
      const exp = Date.now() + TTL_MS;
      sessionStorage.setItem(sessionKey(user.uid), JSON.stringify({ expiresAt: exp }));
      setExpiresAt(exp);
    },
    [user]
  );

  const unlock = useCallback(
    async (pin: string): Promise<boolean> => {
      if (!user) return false;
      const stored = pinHash || (await fetchPinHash());
      if (!stored) return false;
      const hash = await sha256(pin);
      if (hash !== stored) return false;

      const exp = Date.now() + TTL_MS;
      sessionStorage.setItem(sessionKey(user.uid), JSON.stringify({ expiresAt: exp }));
      setExpiresAt(exp);
      return true;
    },
    [user, pinHash]
  );

  const value = useMemo<PinContextValue>(
    () => ({
      mode,
      setMode,
      hasPin,
      unlocked: !!expiresAt && expiresAt > Date.now(),
      expiresAt,
      unlock,
      setup,
      lock,
    }),
    [mode, hasPin, expiresAt, unlock, setup, lock]
  );

  return <PinContext.Provider value={value}>{children}</PinContext.Provider>;
};

export function usePin(): PinContextValue {
  const ctx = useContext(PinContext);
  if (!ctx) throw new Error('usePin must be used within PinProvider');
  return ctx;
}
