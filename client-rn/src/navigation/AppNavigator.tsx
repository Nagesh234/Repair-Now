/**
 * @file AppNavigator.tsx
 * @description React Navigation stack for the Repair Now Client app.
 *
 * Defines all routes and their screen components.
 * Receives `initialRoute` to support deep-linking into Home after auto-login,
 * and `onUserChange` to update the parent (App.tsx) FCM hook when the user
 * logs in or out.
 *
 * Route map:
 *  - Login       → LoginScreen
 *  - Register    → RegisterScreen
 *  - Home        → HomeScreen
 *  - RepairRequest → RepairRequestScreen
 *  - Profile     → ProfileScreen
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/home/HomeScreen';
import RepairRequestScreen from '../screens/repair/RepairRequestScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

/**
 * Type-safe route parameter map for the client app navigator.
 * `undefined` means the route accepts no parameters.
 */
export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    Home: undefined;
    RepairRequest: undefined;
    Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Props accepted by AppNavigator. */
interface AppNavigatorProps {
    /** The first screen to show when the app opens. */
    initialRoute: keyof RootStackParamList;
    /** Callback invoked with the userId after login, or null after logout. */
    onUserChange: (userId: string | null) => void;
}

/**
 * Root stack navigator for the client app.
 * Header is hidden globally; each screen manages its own header if needed.
 */
const AppNavigator: React.FC<AppNavigatorProps> = ({
    initialRoute,
    onUserChange,
}) => (
    <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login">
            {props => <LoginScreen {...props} onUserChange={onUserChange} />}
        </Stack.Screen>
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home">
            {props => <HomeScreen {...props} onLogout={() => onUserChange(null)} />}
        </Stack.Screen>
        <Stack.Screen
            name="RepairRequest"
            component={RepairRequestScreen}
            options={{ headerShown: true, title: 'New Repair Request' }}
        />
        <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ headerShown: true, title: 'Edit Profile' }}
        />
    </Stack.Navigator>
);

export default AppNavigator;
