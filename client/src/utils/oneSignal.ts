import { Capacitor } from '@capacitor/core';

let initialized = false;

export async function initOneSignal(appId: string, externalId?: string): Promise<void> {
  if (initialized) return;
  if (!Capacitor.isNativePlatform()) return;
  if (!appId) return;

  try {
    const OneSignal: any = (globalThis as any)?.OneSignal;
    if (!OneSignal) return;

    OneSignal.Debug?.setLogLevel?.(6);
    OneSignal.initialize(appId);

    if (externalId) {
      try {
        OneSignal.login(externalId);
      } catch {
      }
    }

    try {
      await OneSignal.Notifications.requestPermission(false);
    } catch {
    }

    initialized = true;
  } catch {
  }
}
