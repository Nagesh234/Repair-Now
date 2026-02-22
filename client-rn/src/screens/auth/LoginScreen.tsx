/**
 * @file LoginScreen.tsx
 * @description Login screen for the Repair Now Client app.
 *
 * Supports two login modes:
 *  1. Password login — email + password submitted directly.
 *  2. OTP login     — email + phone number used to send a one-time password,
 *                     then the user enters the code to verify.
 *
 * Google Play policy note:
 *  - No biometric or device credential APIs used.
 *  - Passwords are never stored to disk, only passed through memory to the API.
 */

import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { login, sendOtp, verifyOtp } from '../../api/authApi';
import { saveSession } from '../../store/sessionStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'> & {
    /** Callback to inform App.tsx of the logged-in userId (triggers FCM registration). */
    onUserChange: (userId: string | null) => void;
};

/**
 * LoginScreen component.
 * Handles both password-based and OTP-based login flows in a single screen.
 */
const LoginScreen: React.FC<Props> = ({ navigation, onUserChange }) => {
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [otpCode, setOtpCode] = useState('');
    /** Controls whether the OTP input step is currently displayed. */
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Handles the main action button press.
     * - If password is provided → attempts password login.
     * - If phone is provided and no OTP sent → sends OTP.
     * - If OTP has been sent → verifies the entered code.
     */
    const handleSubmit = async (): Promise<void> => {
        if (!email.trim()) {
            Alert.alert('Validation', 'Please enter your email address.');
            return;
        }
        setIsLoading(true);
        try {
            if (isOtpSent) {
                // Step 2: Verify OTP
                const res = await verifyOtp({ email, code: otpCode });
                const user = res.data.user;
                if (res.status === 200 && user) {
                    await saveSession({
                        userId: user.id,
                        email: user.email,
                        name: user.full_name,
                        role: user.role,
                    });
                    onUserChange(user.id);
                    navigation.replace('Home');
                } else {
                    Alert.alert('Invalid OTP', res.data.error ?? 'Please try again.');
                }
            } else if (password) {
                // Password login
                const res = await login({ email, password });
                const user = res.data.user;
                if (res.status === 200 && user) {
                    await saveSession({
                        userId: user.id,
                        email: user.email,
                        name: user.full_name,
                        role: user.role,
                    });
                    onUserChange(user.id);
                    navigation.replace('Home');
                } else {
                    Alert.alert('Login Failed', res.data.error ?? 'Incorrect credentials.');
                }
            } else {
                // Step 1: Send OTP
                if (!phone.trim()) {
                    Alert.alert('Validation', 'Enter a password or phone number to receive an OTP.');
                    return;
                }
                await sendOtp({ email, phone_number: phone });
                setIsOtpSent(true);
            }
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.error ?? 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

            {/* ── Header ───────────────────────────────────── */}
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Login to Repair Now</Text>

            {isOtpSent ? (
                /* ── OTP Entry Step ───────────────────────────── */
                <>
                    <Text style={styles.info}>Enter the OTP sent to {email}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="OTP Code"
                        value={otpCode}
                        onChangeText={setOtpCode}
                        keyboardType="number-pad"
                        maxLength={6}
                        autoFocus
                    />
                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => setIsOtpSent(false)}>
                        <Text style={styles.linkText}>← Back</Text>
                    </TouchableOpacity>
                </>
            ) : (
                /* ── Credentials Step ────────────────────────── */
                <>
                    <TextInput
                        style={styles.input}
                        placeholder="Email Address"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Mobile Number (for OTP)"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                    />
                    <Text style={styles.orText}>— or login with password —</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Password (optional)"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </>
            )}

            {/* ── Submit Button ─────────────────────────────── */}
            <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel={
                    isOtpSent ? 'Verify OTP' : password ? 'Login with password' : 'Get OTP'
                }>
                {isLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>
                        {isOtpSent ? 'Verify & Login' : password ? 'Login' : 'Get OTP'}
                    </Text>
                )}
            </TouchableOpacity>

            {/* ── Navigate to Register ──────────────────────── */}
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.linkText}>Don't have an account? Register</Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        backgroundColor: '#F5F5F5',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1A1A2E',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 32,
    },
    info: {
        fontSize: 14,
        color: '#333',
        marginBottom: 16,
    },
    input: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 12,
        color: '#1A1A2E',
    },
    orText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 13,
        marginVertical: 8,
    },
    button: {
        backgroundColor: '#6200EE',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 16,
    },
    buttonDisabled: {
        backgroundColor: '#BB90F5',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    linkButton: {
        marginBottom: 16,
    },
    linkText: {
        color: '#6200EE',
        textAlign: 'center',
        fontSize: 14,
        marginTop: 4,
    },
});

export default LoginScreen;
