/**
 * @file RepairRequestScreen.tsx
 * @description Screen for submitting a new repair request in the Client app.
 *
 * Form fields:
 *  - Title (what needs fixing)
 *  - Category (dropdown selection from predefined list)
 *  - Description (free text, optional)
 *  - Address (service location)
 *
 * Google Play policy note:
 *  - Address is entered manually by the user; no location permission is requested.
 *  - No device sensors are accessed on this screen.
 */

import React, { useState, useEffect } from 'react';
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
    View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { createRepair, getCategories } from '../../api/repairApi';
import { getSession } from '../../store/sessionStore';
import { Category } from '../../types/models';

type Props = NativeStackScreenProps<RootStackParamList, 'RepairRequest'>;

/**
 * RepairRequestScreen component.
 * Collects repair details and submits them to the backend via repairApi.
 */
const RepairRequestScreen: React.FC<Props> = ({ navigation }) => {
    const [title, setTitle] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    /** Controls visibility of the category picker. */
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(true);

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const response = await getCategories();
                setCategories(response.data.categories || []);
            } catch (err) {
                console.warn('Failed to fetch categories', err);
                Alert.alert('Error', 'Could not load service categories.');
            } finally {
                setIsFetchingData(false);
            }
        };
        fetchMasterData();
    }, []);

    /**
     * Validates the form and submits the repair request.
     * On success, navigates back to the Home screen.
     */
    const handleSubmit = async (): Promise<void> => {
        if (!title.trim() || !selectedCategory || !address.trim()) {
            Alert.alert('Validation', 'Please fill in title, category, and address.');
            return;
        }
        setIsLoading(true);
        try {
            const session = await getSession();
            if (!session?.userId) {
                Alert.alert('Session Error', 'Please log in again.');
                navigation.replace('Login');
                return;
            }
            await createRepair({
                client_id: session.userId,
                title: title.trim(),
                category_id: selectedCategory.id,
                description: description.trim(),
                address: address.trim(),
            });
            Alert.alert('Success', 'Your repair request has been submitted!', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.error ?? 'Failed to submit. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* ── Title ───────────────────────────────────── */}
                <Text style={styles.label}>What needs fixing? *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Leaking tap in the kitchen"
                    value={title}
                    onChangeText={setTitle}
                    maxLength={100}
                />

                {/* ── Category Picker ──────────────────────────── */}
                <Text style={styles.label}>Category *</Text>
                {isFetchingData ? (
                    <ActivityIndicator size="small" color="#6200EE" style={{ alignSelf: 'flex-start' }} />
                ) : (
                    <TouchableOpacity
                        style={styles.picker}
                        onPress={() => setShowCategoryPicker(v => !v)}
                        accessibilityRole="combobox"
                        accessibilityLabel="Select repair category">
                        <Text style={selectedCategory ? styles.pickerText : styles.pickerPlaceholder}>
                            {selectedCategory ? `${selectedCategory.name} (₹${selectedCategory.inspection_fee})` : 'Select a category…'}
                        </Text>
                        <Text style={styles.pickerArrow}>{showCategoryPicker ? '▲' : '▼'}</Text>
                    </TouchableOpacity>
                )}

                {showCategoryPicker && (
                    <View style={styles.dropdownContainer}>
                        {categories.map(cat => (
                            <TouchableOpacity
                                key={cat.id}
                                style={styles.dropdownItem}
                                onPress={() => { setSelectedCategory(cat); setShowCategoryPicker(false); }}>
                                <Text style={[styles.dropdownText, selectedCategory?.id === cat.id && styles.dropdownTextSelected]}>
                                    {cat.name} — Inspection: ₹{cat.inspection_fee}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* ── Description ─────────────────────────────── */}
                <Text style={styles.label}>Description (optional)</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe the issue in more detail…"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                />

                {/* ── Address ─────────────────────────────────── */}
                <Text style={styles.label}>Service Address *</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Full address where the repair is needed"
                    value={address}
                    onChangeText={setAddress}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                />

                {/* ── Submit Button ────────────────────────────── */}
                <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                    accessibilityRole="button"
                    accessibilityLabel="Submit repair request">
                    {isLoading
                        ? <ActivityIndicator color="#FFF" />
                        : <Text style={styles.buttonText}>Submit Request</Text>}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    scroll: { padding: 20, paddingBottom: 40 },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 12 },
    input: {
        backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD',
        borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12,
        fontSize: 15, color: '#1A1A2E', marginBottom: 4,
    },
    textArea: { minHeight: 90, paddingTop: 12 },
    picker: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD',
        borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 4,
    },
    pickerText: { fontSize: 15, color: '#1A1A2E' },
    pickerPlaceholder: { fontSize: 15, color: '#999' },
    pickerArrow: { fontSize: 12, color: '#666' },
    dropdownContainer: {
        backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0',
        borderRadius: 10, marginBottom: 8, overflow: 'hidden',
    },
    dropdownItem: { paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    dropdownText: { fontSize: 15, color: '#333' },
    dropdownTextSelected: { color: '#6200EE', fontWeight: '600' },
    button: {
        backgroundColor: '#6200EE', paddingVertical: 15, borderRadius: 10,
        alignItems: 'center', marginTop: 24,
    },
    buttonDisabled: { backgroundColor: '#BB90F5' },
    buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});

export default RepairRequestScreen;
