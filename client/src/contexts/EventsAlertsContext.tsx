import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../firebase/AuthContext';

interface EventsAlertsValue {
  unreadCount: number;
  lastSeen: string | null;
  markAllSeen: () => void;
}

const EventsAlertsContext = createContext<EventsAlertsValue | undefined>(undefined);

function keyFor(uid: string) {
  return `events_last_seen_v1:${uid}`;
}

function nowIso() {
  return new Date().toISOString();
}

export const EventsAlertsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  const markAllSeen = useCallback(() => {
    if (!user) return;
    const iso = nowIso();
    try {
      localStorage.setItem(keyFor(user.uid), iso);
    } catch {
    }
    setLastSeen(iso);
    setUnreadCount(0);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setLastSeen(null);
      return;
    }

    let stored: string | null = null;
    try {
      stored = localStorage.getItem(keyFor(user.uid));
    } catch {
      stored = null;
    }

    const effectiveLastSeen = stored || '1970-01-01T00:00:00.000Z';
    setLastSeen(stored);

    const eventsRef = collection(db, 'events');
    const q = query(
      eventsRef,
      where('updated_at', '>', effectiveLastSeen),
      orderBy('updated_at', 'desc'),
      limit(25)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setUnreadCount(snap.size);
      },
      () => {
        setUnreadCount(0);
      }
    );

    return () => unsub();
  }, [user]);

  const value = useMemo<EventsAlertsValue>(
    () => ({ unreadCount, lastSeen, markAllSeen }),
    [unreadCount, lastSeen, markAllSeen]
  );

  return <EventsAlertsContext.Provider value={value}>{children}</EventsAlertsContext.Provider>;
};

export function useEventsAlerts(): EventsAlertsValue {
  const ctx = useContext(EventsAlertsContext);
  if (!ctx) throw new Error('useEventsAlerts must be used within EventsAlertsProvider');
  return ctx;
}
