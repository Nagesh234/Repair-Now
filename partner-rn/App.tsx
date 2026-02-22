/**
 * @file App.tsx
 * @description Root component of the Repair Now Partner app.
 *
 * Responsibilities:
 *  1. Wraps the app in NavigationContainer.
 *  2. Checks AsyncStorage for an existing partner session on startup.
 *  3. Sets the initial navigation route ('PartnerHome' if logged in, 'Login' otherwise).
 *  4. Registers the FCM push token via useFcmToken so the partner receives
 *     new-job and status-change notifications.
 */

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { getSession } from './src/store/sessionStore';
import useFcmToken from './src/hooks/useFcmToken';

/**
 * Root application component for the Partner app.
 */
const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [initialRoute, setInitialRoute] = useState<'Login' | 'MainTabs'>('Login');

    // Register / refresh the FCM token whenever the userId changes
    useFcmToken(userId);

    useEffect(() => {
        /** Check for a persisted partner session on app start. */
        const checkSession = async (): Promise<void> => {
            try {
                const session = await getSession();
                if (session?.userId) {
                    setUserId(session.userId);
                    setInitialRoute('MainTabs');
                }
            } catch (err) {
                if (__DEV__) { console.warn('[App] Session read failed:', err); }
            } finally {
                setIsLoading(false);
            }
        };
        checkSession();
    }, []);

    if (isLoading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#00897B" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <AppNavigator initialRoute={initialRoute} onUserChange={setUserId} />
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
});

export default App;
