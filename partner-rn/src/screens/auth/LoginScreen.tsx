/**
 * @file LoginScreen.tsx
 * @description Login screen for the Repair Now Partner app.
 *
 * Supports both password login and OTP-based login flows.
 * Identical logic to the client app but navigates to 'MainTabs' on success.
 *
 * Google Play policy note:
 *  - Credentials are transmitted over HTTPS only. No passwords are stored locally.
 */

import React, { useState } from 'react';
import {
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
    StyleSheet, Text, TextInput, TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { login, sendOtp, verifyOtp } from '../../api/authApi';
import { saveSession } from '../../store/sessionStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'> & {
    onUserChange: (userId: string | null) => void;
};

/** LoginScreen — partner edition with teal brand colour. */
const LoginScreen: React.FC<Props> = ({ navigation, onUserChange }) => {
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    /** Handles login (password or OTP) based on current state. */
    const handleSubmit = async (): Promise<void> => {
        if (!email.trim()) { Alert.alert('Validation', 'Please enter your email.'); return; }
        setIsLoading(true);
        try {
            if (isOtpSent) {
                const res = await verifyOtp({ email, code: otpCode });
                const user = res.data.user;
                if (res.status === 200 && user) {
                    await saveSession({ userId: user.id, email: user.email, name: user.full_name, role: user.role });
                    onUserChange(user.id);
                    navigation.replace('MainTabs');
                } else {
                    Alert.alert('Invalid OTP', res.data.error ?? 'Please try again.');
                }
            } else if (password) {
                const res = await login({ email, password });
                const user = res.data.user;
                if (res.status === 200 && user) {
                    await saveSession({ userId: user.id, email: user.email, name: user.full_name, role: user.role });
                    onUserChange(user.id);
                    navigation.replace('MainTabs');
                } else {
                    Alert.alert('Login Failed', res.data.error ?? 'Incorrect credentials.');
                }
            } else {
                if (!phone.trim()) { Alert.alert('Validation', 'Enter a password or phone number.'); return; }
                await sendOtp({ email, phone_number: phone });
                setIsOtpSent(true);
            }
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.error ?? 'Something went wrong.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Text style={styles.title}>Partner Login</Text>
            <Text style={styles.subtitle}>Repair Now — Technician App</Text>

            {isOtpSent ? (
                <>
                    <Text style={styles.info}>OTP sent to {email}</Text>
                    <TextInput style={styles.input} placeholder="OTP Code" value={otpCode}
                        onChangeText={setOtpCode} keyboardType="number-pad" maxLength={6} autoFocus />
                    <TouchableOpacity onPress={() => setIsOtpSent(false)}>
                        <Text style={styles.link}>← Back</Text>
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <TextInput style={styles.input} placeholder="Email Address" value={email}
                        onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                    <TextInput style={styles.input} placeholder="Mobile Number (for OTP)" value={phone}
                        onChangeText={setPhone} keyboardType="phone-pad" />
                    <Text style={styles.orText}>— or login with password —</Text>
                    <TextInput style={styles.input} placeholder="Password (optional)" value={password}
                        onChangeText={setPassword} secureTextEntry />
                </>
            )}

            <TouchableOpacity style={[styles.button, isLoading && styles.buttonOff]}
                onPress={handleSubmit} disabled={isLoading}
                accessibilityRole="button" accessibilityLabel="Login">
                {isLoading
                    ? <ActivityIndicator color="#FFF" />
                    : <Text style={styles.buttonText}>{isOtpSent ? 'Verify & Login' : password ? 'Login' : 'Get OTP'}</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.link}>New partner? Register here</Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: '#F0FDF8' },
    title: { fontSize: 28, fontWeight: '700', color: '#004D40', marginBottom: 4 },
    subtitle: { fontSize: 15, color: '#666', marginBottom: 32 },
    info: { fontSize: 14, color: '#333', marginBottom: 16 },
    input: {
        backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', borderRadius: 10,
        paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 12, color: '#1A1A2E',
    },
    orText: { textAlign: 'center', color: '#999', fontSize: 13, marginVertical: 8 },
    button: {
        backgroundColor: '#00897B', paddingVertical: 14, borderRadius: 10,
        alignItems: 'center', marginTop: 12, marginBottom: 16,
    },
    buttonOff: { backgroundColor: '#80CBC4' },
    buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    link: { color: '#00897B', textAlign: 'center', fontSize: 14, marginTop: 4 },
});

export default LoginScreen;
