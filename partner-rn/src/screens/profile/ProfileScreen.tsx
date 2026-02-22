/**
 * @file ProfileScreen.tsx
 * @description Profile editing screen for the Repair Now Partner app.
 *
 * Allows the partner to update name, phone number, and avatar image.
 * Avatar is selected via the system Photo Picker — no CAMERA or
 * READ_MEDIA_IMAGES permission is required on Android 13+.
 *
 * Google Play policy note:
 *  - Photo access uses the Android Photo Picker intent (launchImageLibrary).
 *  - No sensitive permissions are declared for this feature.
 */

import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform,
    ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { updateProfile } from '../../api/authApi';
import { getSession } from '../../store/sessionStore';

/**
 * ProfileScreen component for the partner app.
 */
const ProfileScreen: React.FC = () => {
    const [userId, setUserId] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            const session = await getSession();
            if (session) { setUserId(session.userId); setFullName(session.name); }
        };
        load();
    }, []);

    /**
     * Opens the system Photo Picker. No runtime permission needed on Android 13+ (API 33+).
     * Falls back gracefully on older OS versions.
     */
    const handlePickAvatar = (): void => {
        launchImageLibrary(
            { mediaType: 'photo', quality: 0.8, selectionLimit: 1 },
            response => {
                if (response.didCancel || response.errorCode) { return; }
                const uri = response.assets?.[0]?.uri;
                if (uri) { setAvatarUri(uri); }
            },
        );
    };

    /**
     * Sends the profile update as multipart/form-data to the backend.
     */
    const handleSave = async (): Promise<void> => {
        if (!userId) { return; }
        setIsLoading(true);
        try {
            const formData = new FormData();
            if (fullName) { formData.append('full_name', fullName); }
            if (phone) { formData.append('phone_number', phone); }
            if (avatarUri) {
                const filename = avatarUri.split('/').pop() ?? 'avatar.jpg';
                formData.append('avatar', { uri: avatarUri, name: filename, type: 'image/jpeg' } as any);
            }
            const res = await updateProfile(userId, formData);
            if (res.data.user) {
                Alert.alert('Success', 'Profile updated!');
            } else {
                Alert.alert('Error', res.data.error ?? 'Update failed.');
            }
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.error ?? 'Something went wrong.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* ── Avatar ──────────────────────────────────── */}
                <TouchableOpacity style={styles.avatarWrap} onPress={handlePickAvatar}
                    accessibilityRole="button" accessibilityLabel="Change profile photo">
                    {avatarUri ? <Image source={{ uri: avatarUri }} style={styles.avatar} />
                        : <View style={styles.avatarPlaceholder}><Text style={styles.avatarPlaceholderTxt}>👤</Text></View>}
                    <View style={styles.editBadge}><Text style={styles.editBadgeTxt}>✏️</Text></View>
                </TouchableOpacity>
                <Text style={styles.hint}>Tap to change photo</Text>

                {/* ── Fields ──────────────────────────────────── */}
                <Text style={styles.label}>Full Name</Text>
                <TextInput style={styles.input} value={fullName} onChangeText={setFullName}
                    placeholder="Your full name" autoCapitalize="words" />

                <Text style={styles.label}>Phone Number</Text>
                <TextInput style={styles.input} value={phone} onChangeText={setPhone}
                    placeholder="Your mobile number" keyboardType="phone-pad" />

                {/* ── Save Button ──────────────────────────────── */}
                <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonOff]}
                    onPress={handleSave} disabled={isLoading}
                    accessibilityRole="button" accessibilityLabel="Save profile">
                    {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Save Changes</Text>}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0FDF8' },
    scroll: { padding: 24, paddingBottom: 40, alignItems: 'center' },
    avatarWrap: { width: 110, height: 110, borderRadius: 55, position: 'relative', marginBottom: 4 },
    avatar: { width: 110, height: 110, borderRadius: 55 },
    avatarPlaceholder: {
        width: 110, height: 110, borderRadius: 55, backgroundColor: '#DDD',
        justifyContent: 'center', alignItems: 'center',
    },
    avatarPlaceholderTxt: { fontSize: 48 },
    editBadge: {
        position: 'absolute', bottom: 0, right: 0, backgroundColor: '#00897B',
        borderRadius: 14, width: 28, height: 28, justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#FFF',
    },
    editBadgeTxt: { fontSize: 12 },
    hint: { fontSize: 12, color: '#999', marginBottom: 24 },
    label: { alignSelf: 'flex-start', fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 4 },
    input: {
        width: '100%', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD',
        borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12,
        fontSize: 16, color: '#1A1A2E', marginBottom: 12,
    },
    button: {
        width: '100%', backgroundColor: '#00897B', paddingVertical: 14,
        borderRadius: 10, alignItems: 'center', marginTop: 16,
    },
    buttonOff: { backgroundColor: '#80CBC4' },
    buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});

export default ProfileScreen;
