/**
 * @file sessionStore.ts
 * @description Local session management using AsyncStorage for the Repair Now Partner app.
 *
 * Stores and retrieves the logged-in partner's non-sensitive session data
 * (user ID, name, email, role). Passwords and tokens are NEVER stored locally.
 *
 * Google Play policy note: Only the minimum required user data is persisted
 * in the app's private AsyncStorage namespace — not shared with other apps.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSession } from '../types/models';

/** The AsyncStorage key under which the partner session JSON is stored. */
const SESSION_KEY = '@repairnow_partner_session';

/**
 * Persist the partner session locally after a successful login or OTP verification.
 * @param session - Non-sensitive partner user details from the backend.
 */
export const saveSession = async (session: UserSession): Promise<void> => {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

/**
 * Retrieve the persisted partner session.
 * @returns The {@link UserSession} object, or `null` if not logged in.
 */
export const getSession = async (): Promise<UserSession | null> => {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) { return null; }
    return JSON.parse(raw) as UserSession;
};

/**
 * Remove the partner session from storage (used on logout).
 */
export const clearSession = async (): Promise<void> => {
    await AsyncStorage.removeItem(SESSION_KEY);
};
