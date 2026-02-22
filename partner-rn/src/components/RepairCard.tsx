/**
 * @file RepairCard.tsx
 * @description Reusable card for displaying a repair job in the partner app.
 *
 * Displays the job title, category, description preview, address, and status badge.
 * Identical in structure to the client app's RepairCard but without the
 * partner_name field (the partner already knows they're assigned).
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Repair } from '../types/models';
import StatusBadge from './StatusBadge';

interface RepairCardProps {
    repair: Repair;
}

/**
 * RepairCard component for the partner app.
 */
const RepairCard: React.FC<RepairCardProps> = ({ repair }) => (
    <View style={styles.card}>
        <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={1}>{repair.title}</Text>
            <StatusBadge status={repair.status} />
        </View>
        <Text style={styles.category}>{repair.category}</Text>
        {repair.estimated_cost !== undefined && repair.estimated_cost !== null && (
            <Text style={styles.estimate}>Estimate Provided: ₹{repair.estimated_cost}</Text>
        )}
        {!!repair.description && (
            <Text style={styles.description} numberOfLines={2}>{repair.description}</Text>
        )}
        <Text style={styles.address} numberOfLines={1}>📍 {repair.address}</Text>
        <Text style={styles.date}>
            {new Date(repair.created_at).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
            })}
        </Text>
    </View>
);

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 4,
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    title: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', flex: 1, marginRight: 8 },
    category: { fontSize: 13, color: '#00897B', fontWeight: '600', marginBottom: 6 },
    estimate: { fontSize: 13, color: '#E65100', fontWeight: '700', marginBottom: 6 },
    description: { fontSize: 13, color: '#555', marginBottom: 6, lineHeight: 18 },
    address: { fontSize: 12, color: '#888', marginBottom: 6 },
    date: { fontSize: 11, color: '#BBB', marginTop: 4, textAlign: 'right' },
});

export default RepairCard;
