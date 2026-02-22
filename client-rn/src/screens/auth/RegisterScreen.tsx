/**
 * @file RegisterScreen.tsx
 * @description Registration screen for the Repair Now Client app.
 *
 * Flow:
 *  1. User fills in full name, email, phone, and password.
 *  2. Uniqueness check is run for email + phone.
 *  3. OTP is sent to the email address.
 *  4. User enters the OTP to complete registration.
 *
 * Google Play policy note:
 *  - Only name, email, phone, and password are collected — the minimum
 *    required to create an account.
 *  - Phone number is used solely for OTP verification, not for marketing.
 */

import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { checkUniqueness, sendOtp, verifyOtp, register } from '../../api/authApi';
import { saveSession } from '../../store/sessionStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

/** Internal state tracking the current registration step. */
type RegistrationStep = 'form' | 'otp';

/**
 * RegisterScreen component.
 * Guides the client through a 2-step registration: form entry → OTP verification.
 */
const RegisterScreen: React.FC<Props> = ({ navigation }) => {
    const [step, setStep] = useState<RegistrationStep>('form');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Validates the registration form, checks uniqueness, and sends OTP.
     * On success, advances to the OTP entry step.
     */
    const handleRegister = async (): Promise<void> => {
        if (!fullName || !email || !phone || !password) {
            Alert.alert('Validation', 'Please fill in all fields.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Validation', 'Passwords do not match.');
            return;
        }
        setIsLoading(true);
        try {
            // 1. Check that email and phone are not already in use
            await checkUniqueness({ email, phone_number: phone });
            // 2. Register the account on the backend
            await register({ email, password, full_name: fullName, role: 'client' });
            // 3. Send OTP for email verification
            await sendOtp({ email, phone_number: phone });
            setStep('otp');
        } catch (err: any) {
            const msg = err?.response?.data?.error ?? 'Registration failed. Please try again.';
            Alert.alert('Error', msg);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Verifies the OTP entered by the user.
     * On success, saves the session and navigates to Home.
     */
    const handleVerifyOtp = async (): Promise<void> => {
        if (!otpCode) {
            Alert.alert('Validation', 'Please enter the OTP.');
            return;
        }
        setIsLoading(true);
        try {
            const res = await verifyOtp({ email, code: otpCode });
            const user = res.data.user;
            if (res.status === 200 && user) {
                await saveSession({
                    userId: user.id,
                    email: user.email,
                    name: user.full_name,
                    role: user.role,
                });
                navigation.replace('Home');
            } else {
                Alert.alert('Invalid OTP', res.data.error ?? 'Please try again.');
            }
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.error ?? 'OTP verification failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join Repair Now as a Client</Text>

                {step === 'form' ? (
                    /* ── Registration Form ───────────────────────── */
                    <>
                        <TextInput style={styles.input} placeholder="Full Name" value={fullName}
                            onChangeText={setFullName} autoCapitalize="words" />
                        <TextInput style={styles.input} placeholder="Email Address" value={email}
                            onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                        <TextInput style={styles.input} placeholder="Mobile Number" value={phone}
                            onChangeText={setPhone} keyboardType="phone-pad" />
                        <TextInput style={styles.input} placeholder="Password" value={password}
                            onChangeText={setPassword} secureTextEntry />
                        <TextInput
                            style={[styles.input, password && confirmPassword && password !== confirmPassword && styles.inputError]}
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />

                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={isLoading}
                            accessibilityRole="button"
                            accessibilityLabel="Register">
                            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register & Send OTP</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Text style={styles.linkText}>Already have an account? Login</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    /* ── OTP Verification Step ───────────────────── */
                    <>
                        <Text style={styles.info}>An OTP has been sent to {email}{'\n'}Please enter it below.</Text>
                        <TextInput style={styles.input} placeholder="6-digit OTP" value={otpCode}
                            onChangeText={setOtpCode} keyboardType="number-pad" maxLength={6} autoFocus />

                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleVerifyOtp}
                            disabled={isLoading}
                            accessibilityRole="button"
                            accessibilityLabel="Verify OTP">
                            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify & Complete</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setStep('form')}>
                            <Text style={styles.linkText}>← Back</Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
    title: { fontSize: 28, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
    subtitle: { fontSize: 16, color: '#666', marginBottom: 32 },
    info: { fontSize: 14, color: '#333', marginBottom: 20, lineHeight: 22 },
    input: {
        backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD',
        borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12,
        fontSize: 16, marginBottom: 12, color: '#1A1A2E',
    },
    inputError: { borderColor: '#E53935' },
    button: {
        backgroundColor: '#6200EE', paddingVertical: 14, borderRadius: 10,
        alignItems: 'center', marginTop: 12, marginBottom: 16,
    },
    buttonDisabled: { backgroundColor: '#BB90F5' },
    buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    linkText: { color: '#6200EE', textAlign: 'center', fontSize: 14, marginTop: 4 },
});

export default RegisterScreen;
