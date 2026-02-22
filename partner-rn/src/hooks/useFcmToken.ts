/**
 * @file useFcmToken.ts
 * @description Custom hook that fetches the device's FCM push token
 * and registers it with the Repair Now backend on app startup.
 *
 * Called in App.tsx once the partner session is confirmed.
 * Handles permission requests and token refresh automatically.
 *
 * Google Play policy note:
 *  - Push notifications are used exclusively for repair job alerts.
 *  - No marketing or third-party messaging is sent.
 */

import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import { updateFcmToken } from '../api/authApi';

/**
 * Registers the device's FCM token with the backend for the given partner.
 * Also subscribes to token refresh events for the lifetime of the component.
 *
 * @param userId - The logged-in partner's ID, or `null` if not authenticated.
 */
const useFcmToken = (userId: string | null): void => {
    useEffect(() => {
        if (!userId) { return; }

        const registerToken = async (token: string): Promise<void> => {
            try {
                await updateFcmToken(userId, { fcm_token: token });
            } catch (err) {
                if (__DEV__) {
                    console.warn('[FCM Partner] Failed to register token:', err);
                }
            }
        };

        const init = async (): Promise<void> => {
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (!enabled) { return; }

            const token = await messaging().getToken();
            await registerToken(token);
        };

        init();

        const unsubscribe = messaging().onTokenRefresh(registerToken);
        return unsubscribe;
    }, [userId]);
};

export default useFcmToken;
