/**
 * @file RatingDialog.tsx
 * @description Shows a 1-5 star rating prompt after a client's repair is completed.
 * Submits the rating to the backend and updates the partner's running average score.
 */

import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { rateRepair } from '../api/repairApi';

interface RatingDialogProps {
    repairId: string;
    repairTitle: string;
    visible: boolean;
    onClose: () => void;
}

const STARS = [1, 2, 3, 4, 5] as const;

const RatingDialog: React.FC<RatingDialogProps> = ({ repairId, repairTitle, visible, onClose }) => {
    const [selectedStars, setSelectedStars] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (selectedStars === 0) {
            Alert.alert('Select a rating', 'Please tap a star to rate the service.');
            return;
        }
        setIsSubmitting(true);
        try {
            await rateRepair(repairId, { rating: selectedStars });
            Alert.alert('Thank You!', `You rated this repair ${selectedStars} star${selectedStars > 1 ? 's' : ''}.`);
            onClose();
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.error ?? 'Could not submit rating. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <Text style={styles.title}>Rate Your Service</Text>
                    <Text style={styles.subtitle} numberOfLines={2}>
                        How was your experience for "{repairTitle}"?
                    </Text>

                    {/* ─ Star Row ─────────────────────────────────── */}
                    <View style={styles.starRow}>
                        {STARS.map(star => (
                            <TouchableOpacity
                                key={star}
                                onPress={() => setSelectedStars(star)}
                                accessibilityLabel={`Rate ${star} stars`}
                                accessibilityRole="button">
                                <Text style={[styles.star, star <= selectedStars && styles.starSelected]}>
                                    ★
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {selectedStars > 0 && (
                        <Text style={styles.ratingLabel}>
                            {selectedStars === 1 ? 'Poor'
                                : selectedStars === 2 ? 'Fair'
                                    : selectedStars === 3 ? 'Good'
                                        : selectedStars === 4 ? 'Great'
                                            : 'Excellent!'}
                        </Text>
                    )}

                    {/* ─ Buttons ─────────────────────────────────── */}
                    <View style={styles.btnRow}>
                        <TouchableOpacity style={styles.skipBtn} onPress={onClose}>
                            <Text style={styles.skipText}>Skip</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.submitBtn, isSubmitting && styles.submitBtnOff]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}>
                            {isSubmitting
                                ? <ActivityIndicator size="small" color="#FFF" />
                                : <Text style={styles.submitText}>Submit Rating</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center', alignItems: 'center',
    },
    card: {
        backgroundColor: '#FFF', width: '88%', borderRadius: 20,
        padding: 24, elevation: 8, alignItems: 'center',
    },
    title: { fontSize: 20, fontWeight: '700', color: '#1A1A2E', marginBottom: 6 },
    subtitle: { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 20 },
    starRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    star: { fontSize: 42, color: '#DDD' },
    starSelected: { color: '#FFC107' },
    ratingLabel: { fontSize: 14, fontWeight: '600', color: '#6200EE', marginBottom: 20 },
    btnRow: { flexDirection: 'row', gap: 12, width: '100%' },
    skipBtn: {
        flex: 1, paddingVertical: 12, borderRadius: 10,
        backgroundColor: '#F5F5F5', alignItems: 'center',
    },
    skipText: { color: '#777', fontWeight: '600' },
    submitBtn: {
        flex: 2, paddingVertical: 12, borderRadius: 10,
        backgroundColor: '#6200EE', alignItems: 'center',
    },
    submitBtnOff: { backgroundColor: '#BB90F5' },
    submitText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});

export default RatingDialog;
