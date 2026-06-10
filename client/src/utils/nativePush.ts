import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { auth, db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';

let initialized = false;

export async function registerNativePush(): Promise<void> {
  if (initialized) return;
  initialized = true;

  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const permStatus = await PushNotifications.requestPermissions();
    if (permStatus.receive !== 'granted') {
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener('registration', async (token) => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';

        await setDoc(
          doc(db, 'members', user.uid),
          {
            fcm_token: token.value,
            fcm_platform: platform,
            fcm_token_updated_at: new Date(),
          },
          { merge: true }
        );
      } catch {
      }
    });

    PushNotifications.addListener('registrationError', () => {
    });

    PushNotifications.addListener('pushNotificationReceived', () => {
    });

    PushNotifications.addListener('pushNotificationActionPerformed', () => {
    });
  } catch {
  }
}
