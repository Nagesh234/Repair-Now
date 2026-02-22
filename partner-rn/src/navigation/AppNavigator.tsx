/**
 * @file AppNavigator.tsx
 * @description Navigation structure for the Repair Now Partner app.
 *
 * Structure:
 *  - Root: NativeStack navigator
 *      - Login       (no auth required)
 *      - Register    (no auth required)
 *      - MainTabs    → Bottom tab navigator
 *          - PartnerHome  (available repair jobs)
 *          - MyJobs       (partner's accepted jobs)
 *      - Profile     (modal-style from any tab screen)
 *
 * Typed route map allows type-safe navigation throughout the app.
 */

import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import PartnerHomeScreen from '../screens/home/PartnerHomeScreen';
import MyJobsScreen from '../screens/jobs/MyJobsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

/** Type-safe parameter list for the root stack navigator. */
export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    MainTabs: undefined;
    Profile: undefined;
};

/** Type-safe parameter list for the bottom tab navigator. */
export type TabParamList = {
    PartnerHome: undefined;
    MyJobs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

/** Partner app primary colour. */
const PRIMARY = '#00897B';

/**
 * Bottom tab navigator shown after the partner logs in.
 * Contains the Available Jobs and My Jobs tabs.
 */
const MainTabs: React.FC = () => (
    <Tab.Navigator
        screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: PRIMARY,
            tabBarInactiveTintColor: '#999',
            tabBarStyle: { elevation: 8, shadowOpacity: 0.1 },
            tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        }}>
        <Tab.Screen
            name="PartnerHome"
            component={PartnerHomeScreen as any}
            options={{
                tabBarLabel: 'Available',
                tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>🔍</Text>,
            }}
        />
        <Tab.Screen
            name="MyJobs"
            component={MyJobsScreen}
            options={{
                tabBarLabel: 'My Jobs',
                tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>🔧</Text>,
            }}
        />
    </Tab.Navigator>
);

interface AppNavigatorProps {
    initialRoute: keyof RootStackParamList;
    onUserChange: (userId: string | null) => void;
}

/**
 * Root stack navigator for the Partner app.
 * Injects `onUserChange` callback into auth screens via render props.
 */
const AppNavigator: React.FC<AppNavigatorProps> = ({ initialRoute, onUserChange }) => (
    <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login">
            {props => <LoginScreen {...props} onUserChange={onUserChange} />}
        </Stack.Screen>
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ headerShown: true, title: 'Edit Profile', headerTintColor: PRIMARY }}
        />
    </Stack.Navigator>
);

const styles = StyleSheet.create({
    tabIcon: { fontSize: 20 },
});

export default AppNavigator;
