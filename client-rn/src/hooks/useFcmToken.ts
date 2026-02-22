/**
 * @file useFcmToken.ts
 * @description Custom hook that fetches the device's FCM push token and
 * registers it with the Repair Now backend on app startup.
 *
 * Called in App.tsx once the user session is confirmed.
 * The token is refreshed automatically via the `onTokenRefresh` listener.
 *
 * Google Play policy note:
 *  - Push notifications only carry repair-related content updates.
 *  - No marketing or third-party messaging is sent.
 *  - The FCM token never contains personally identifiable information.
 */

import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import { updateFcmToken } from '../api/authApi';

/**
 * Requests notification permission (required on iOS and Android 13+),
 * retrieves the current FCM token, and sends it to the backend.
 * Also subscribes to token refresh events.
 *
 * @param userId - The logged-in user's ID, or `null` if not authenticated.
 *                 If `null`, the hook is a no-op.
 */
const useFcmToken = (userId: string | null): void => {
    useEffect(() => {
        // Do nothing if the user is not authenticated
        if (!userId) { return; }

        /**
         * Registers the FCM token with the backend.
         * @param token - The device's current FCM registration token.
         */
        const registerToken = async (token: string): Promise<void> => {
            try {
                await updateFcmToken(userId, { fcm_token: token });
            } catch (err) {
                // Non-fatal: log in dev, silently fail in production
                if (__DEV__) {
                    console.warn('[FCM] Failed to register token:', err);
                }
            }
        };

        const init = async (): Promise<void> => {
            // Request permission (required on iOS; on Android 13+ shown as a dialog)
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (!enabled) {
                if (__DEV__) {
                    console.warn('[FCM] Notification permission not granted');
                }
                return;
            }

            // Fetch the current FCM token and register it
            const token = await messaging().getToken();
            await registerToken(token);
        };

        init();

        // Listen for token refreshes (e.g. after app reinstall or token expiry)
        const unsubscribe = messaging().onTokenRefresh(registerToken);

        // Cleanup: remove the listener when the component unmounts
        return unsubscribe;
    }, [userId]);
};

export default useFcmToken;
