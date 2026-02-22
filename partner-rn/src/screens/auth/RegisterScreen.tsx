/**
 * @file RegisterScreen.tsx
 * @description Registration screen for the Repair Now Partner app.
 *
 * Flow: form entry → OTP verification → navigates to MainTabs.
 * Role is always set to 'partner' when calling the registration API.
 *
 * Google Play policy note:
 *  - Collects only the minimum required fields: name, email, phone, password.
 *  - Phone number is used exclusively for OTP verification, not for marketing.
 */

import React, { useState } from 'react';
import {
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
    ScrollView, StyleSheet, Text, TextInput, TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { checkUniqueness, sendOtp, verifyOtp, register } from '../../api/authApi';
import { saveSession } from '../../store/sessionStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;
type Step = 'form' | 'otp';

/**
 * RegisterScreen component for partner registration.
 */
const RegisterScreen: React.FC<Props> = ({ navigation }) => {
    const [step, setStep] = useState<Step>('form');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    /** Validates form, checks uniqueness, registers, then sends OTP. */
    const handleRegister = async (): Promise<void> => {
        if (!fullName || !email || !phone || !password) { Alert.alert('Validation', 'All fields are required.'); return; }
        if (password !== confirmPassword) { Alert.alert('Validation', 'Passwords do not match.'); return; }
        setIsLoading(true);
        try {
            await checkUniqueness({ email, phone_number: phone });
            await register({ email, password, full_name: fullName, role: 'partner' });
            await sendOtp({ email, phone_number: phone });
            setStep('otp');
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.error ?? 'Registration failed.');
        } finally {
            setIsLoading(false);
        }
    };

    /** Verifies OTP and creates a local session on success. */
    const handleVerifyOtp = async (): Promise<void> => {
        if (!otpCode) { Alert.alert('Validation', 'Please enter the OTP.'); return; }
        setIsLoading(true);
        try {
            const res = await verifyOtp({ email, code: otpCode });
            const user = res.data.user;
            if (res.status === 200 && user) {
                await saveSession({ userId: user.id, email: user.email, name: user.full_name, role: user.role });
                navigation.replace('MainTabs');
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
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Partner Registration</Text>
                <Text style={styles.subtitle}>Join as a Repair Technician</Text>

                {step === 'form' ? (
                    <>
                        <TextInput style={styles.input} placeholder="Full Name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
                        <TextInput style={styles.input} placeholder="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                        <TextInput style={styles.input} placeholder="Mobile Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
                        <TextInput
                            style={[styles.input, (!!password && !!confirmPassword && password !== confirmPassword) ? styles.inputError : undefined]}
                            placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

                        <TouchableOpacity style={[styles.button, isLoading && styles.buttonOff]}
                            onPress={handleRegister} disabled={isLoading} accessibilityRole="button" accessibilityLabel="Register">
                            {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Register & Send OTP</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Text style={styles.link}>Already registered? Login</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <Text style={styles.info}>An OTP has been sent to {email}</Text>
                        <TextInput style={styles.input} placeholder="6-digit OTP" value={otpCode}
                            onChangeText={setOtpCode} keyboardType="number-pad" maxLength={6} autoFocus />
                        <TouchableOpacity style={[styles.button, isLoading && styles.buttonOff]}
                            onPress={handleVerifyOtp} disabled={isLoading} accessibilityRole="button" accessibilityLabel="Verify OTP">
                            {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Verify & Complete</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setStep('form')}>
                            <Text style={styles.link}>← Back</Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0FDF8' },
    scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
    title: { fontSize: 26, fontWeight: '700', color: '#004D40', marginBottom: 4 },
    subtitle: { fontSize: 15, color: '#666', marginBottom: 32 },
    info: { fontSize: 14, color: '#333', marginBottom: 20 },
    input: {
        backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', borderRadius: 10,
        paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 12, color: '#1A1A2E',
    },
    inputError: { borderColor: '#E53935' },
    button: { backgroundColor: '#00897B', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 12, marginBottom: 16 },
    buttonOff: { backgroundColor: '#80CBC4' },
    buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    link: { color: '#00897B', textAlign: 'center', fontSize: 14, marginTop: 4 },
});

export default RegisterScreen;
