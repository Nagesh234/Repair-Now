/**
 * @file App.tsx
 * @description Root component of the Repair Now Client app.
 *
 * Responsibilities:
 *  1. Wraps the entire app in NavigationContainer (required by React Navigation).
 *  2. Checks AsyncStorage for an existing user session on startup.
 *  3. Sets the initial navigation route ('Home' if logged in, 'Login' otherwise).
 *  4. Registers the FCM push token via the useFcmToken hook.
 *
 * Google Play policy note:
 *  - The app does NOT access camera, contacts, location, or microphone.
 *  - The only permission requested at runtime is POST_NOTIFICATIONS (Android 13+),
 *    which is required for job-status push notifications.
 */

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { getSession } from './src/store/sessionStore';
import useFcmToken from './src/hooks/useFcmToken';

/**
 * Root application component.
 * Handles the splash-screen-equivalent loading state while the session
 * is being read from AsyncStorage.
 */
const App: React.FC = () => {
    /** Whether session data is being loaded from AsyncStorage. */
    const [isLoading, setIsLoading] = useState(true);

    /**
     * The logged-in user's ID, used by the FCM hook.
     * `null` if no session exists (user is not logged in).
     */
    const [userId, setUserId] = useState<string | null>(null);

    /**
     * The initial route name for the navigator.
     * Determined by whether a valid session exists in AsyncStorage.
     */
    const [initialRoute, setInitialRoute] = useState<'Login' | 'Home'>('Login');

    // Register FCM token whenever userId changes (login / logout)
    useFcmToken(userId);

    useEffect(() => {
        /**
         * On mount, check AsyncStorage for a persisted user session.
         * If found, skip Login and go directly to Home.
         */
        const checkSession = async (): Promise<void> => {
            try {
                const session = await getSession();
                if (session?.userId) {
                    setUserId(session.userId);
                    setInitialRoute('Home');
                }
            } catch (err) {
                // If session read fails, default to Login
                if (__DEV__) {
                    console.warn('[App] Failed to read session:', err);
                }
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();
    }, []);

    // Show a loading spinner while checking the session
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200EE" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <AppNavigator
                initialRoute={initialRoute}
                onUserChange={setUserId}
            />
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
});

export default App;
