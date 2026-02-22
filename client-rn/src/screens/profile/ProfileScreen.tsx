/**
 * @file ProfileScreen.tsx
 * @description Profile editing screen for the Repair Now Client app.
 *
 * Allows the client to update:
 *  - Display name
 *  - Phone number
 *  - Avatar image (via the system Photo Picker — no CAMERA permission needed)
 *
 * Google Play policy note:
 *  - Photo access uses `react-native-image-picker` with `launchImageLibrary`,
 *    which invokes the system Photo Picker on Android 13+ — no READ_MEDIA_IMAGES
 *    permission is required for this API.
 *  - Only the selected image is read; no gallery scanning occurs.
 */

import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { updateProfile } from '../../api/authApi';
import { getSession } from '../../store/sessionStore';

/**
 * ProfileScreen component.
 * Pre-fills the name from the current session and allows the user to
 * update profile fields with optional avatar upload.
 */
const ProfileScreen: React.FC = () => {
    const [userId, setUserId] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    /** URI of the locally selected image (before upload). */
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    /** Load the current session name into the full name field on mount. */
    useEffect(() => {
        const loadSession = async () => {
            const session = await getSession();
            if (session) {
                setUserId(session.userId);
                setFullName(session.name);
            }
        };
        loadSession();
    }, []);

    /**
     * Opens the system Photo Picker to select an avatar image.
     * Uses `launchImageLibrary` from react-native-image-picker.
     * No runtime CAMERA or storage permission is required on Android 13+.
     */
    const handlePickAvatar = (): void => {
        launchImageLibrary(
            { mediaType: 'photo', quality: 0.8, selectionLimit: 1 },
            response => {
                if (response.didCancel) { return; }
                if (response.errorCode) {
                    Alert.alert('Error', response.errorMessage ?? 'Could not open photo library.');
                    return;
                }
                const uri = response.assets?.[0]?.uri;
                if (uri) { setAvatarUri(uri); }
            },
        );
    };

    /**
     * Builds a FormData payload and sends the profile update to the backend.
     * Avatar upload uses multipart/form-data.
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
                const type = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
                formData.append('avatar', { uri: avatarUri, name: filename, type } as any);
            }

            const res = await updateProfile(userId, formData);
            if (res.data.user) {
                Alert.alert('Success', 'Profile updated successfully!');
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
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* ── Avatar Section ──────────────────────────── */}
                <TouchableOpacity
                    style={styles.avatarContainer}
                    onPress={handlePickAvatar}
                    accessibilityRole="button"
                    accessibilityLabel="Change profile photo">
                    {avatarUri ? (
                        <Image source={{ uri: avatarUri }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarPlaceholderText}>👤</Text>
                        </View>
                    )}
                    <View style={styles.editBadge}>
                        <Text style={styles.editBadgeText}>✏️</Text>
                    </View>
                </TouchableOpacity>

                <Text style={styles.avatarHint}>Tap to change photo</Text>

                {/* ── Fields ─────────────────────────────────── */}
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Your full name"
                    autoCapitalize="words"
                />

                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Your mobile number"
                    keyboardType="phone-pad"
                />

                {/* ── Save Button ─────────────────────────────── */}
                <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={handleSave}
                    disabled={isLoading}
                    accessibilityRole="button"
                    accessibilityLabel="Save profile changes">
                    {isLoading
                        ? <ActivityIndicator color="#FFF" />
                        : <Text style={styles.buttonText}>Save Changes</Text>}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    scroll: { padding: 24, paddingBottom: 40, alignItems: 'center' },
    avatarContainer: {
        width: 110, height: 110, borderRadius: 55, marginBottom: 4, position: 'relative',
    },
    avatar: { width: 110, height: 110, borderRadius: 55 },
    avatarPlaceholder: {
        width: 110, height: 110, borderRadius: 55, backgroundColor: '#DDD',
        justifyContent: 'center', alignItems: 'center',
    },
    avatarPlaceholderText: { fontSize: 48 },
    editBadge: {
        position: 'absolute', bottom: 0, right: 0, backgroundColor: '#6200EE',
        borderRadius: 14, width: 28, height: 28, justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#FFF',
    },
    editBadgeText: { fontSize: 12 },
    avatarHint: { fontSize: 12, color: '#999', marginBottom: 24 },
    label: {
        alignSelf: 'flex-start', fontSize: 14, fontWeight: '600',
        color: '#333', marginBottom: 6, marginTop: 4,
    },
    input: {
        width: '100%', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD',
        borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12,
        fontSize: 16, color: '#1A1A2E', marginBottom: 12,
    },
    button: {
        width: '100%', backgroundColor: '#6200EE', paddingVertical: 14,
        borderRadius: 10, alignItems: 'center', marginTop: 16,
    },
    buttonDisabled: { backgroundColor: '#BB90F5' },
    buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});

export default ProfileScreen;
