/**
 * @file sessionStore.ts
 * @description Local session management using AsyncStorage for the Repair Now Client app.
 *
 * Stores and retrieves the logged-in user's non-sensitive session data
 * (user ID, name, email, role). Passwords and tokens are NEVER stored locally.
 *
 * Google Play policy note: Only the minimum required user data is persisted.
 * Data is stored in the app's private AsyncStorage — not shared with other apps.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSession } from '../types/models';

/** The AsyncStorage key under which the session JSON is stored. */
const SESSION_KEY = '@repairnow_client_session';

/**
 * Persist the user session locally after a successful login or OTP verification.
 * @param session - Non-sensitive user details returned from the backend.
 */
export const saveSession = async (session: UserSession): Promise<void> => {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

/**
 * Retrieve the persisted user session.
 * @returns The {@link UserSession} object, or `null` if the user is not logged in.
 */
export const getSession = async (): Promise<UserSession | null> => {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) { return null; }
    return JSON.parse(raw) as UserSession;
};

/**
 * Remove the user session from storage (used on logout).
 * After this call, `getSession` will return `null`.
 */
export const clearSession = async (): Promise<void> => {
    await AsyncStorage.removeItem(SESSION_KEY);
};
