/**
 * @file RepairCard.tsx
 * @description Reusable card component that displays a single repair request summary.
 *
 * Shown in the HomeScreen repair list. Displays title, category, address,
 * description preview, creation date, and a coloured status badge.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Repair } from '../types/models';
import StatusBadge from './StatusBadge';

/** Props accepted by RepairCard. */
interface RepairCardProps {
    /** The repair object to display. */
    repair: Repair;
}

/**
 * RepairCard component.
 * Renders a Material-style card with repair metadata and a status chip.
 */
const RepairCard: React.FC<RepairCardProps> = ({ repair }) => (
    <View style={styles.card}>
        {/* ── Header row: title + status ──────────────────── */}
        <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={1}>{repair.title}</Text>
            <StatusBadge status={repair.status} />
        </View>

        {/* ── Category ────────────────────────────────────── */}
        <Text style={styles.category}>{repair.category}</Text>

        {/* ── Estimate ────────────────────────────────────── */}
        {repair.estimated_cost !== undefined && repair.estimated_cost !== null && (
            <Text style={styles.estimate}>Quoted Estimate: ₹{repair.estimated_cost}</Text>
        )}

        {/* ── Description preview ─────────────────────────── */}
        {!!repair.description && (
            <Text style={styles.description} numberOfLines={2}>{repair.description}</Text>
        )}

        {/* ── Address ─────────────────────────────────────── */}
        <Text style={styles.address} numberOfLines={1}>📍 {repair.address}</Text>

        {/* ── Partner assigned (client view shows assigned tech) ─ */}
        {repair.partner_name && (
            <Text style={styles.partner}>🔧 Assigned to: {repair.partner_name}</Text>
        )}

        {/* ── Date ─────────────────────────────────────────── */}
        <Text style={styles.date}>
            {new Date(repair.created_at).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
            })}
        </Text>
    </View>
);

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.07,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', flex: 1, marginRight: 8 },
    category: { fontSize: 13, color: '#6200EE', fontWeight: '600', marginBottom: 6 },
    estimate: { fontSize: 13, color: '#E65100', fontWeight: '700', marginBottom: 6 },
    description: { fontSize: 13, color: '#555', marginBottom: 6, lineHeight: 18 },
    address: { fontSize: 12, color: '#888', marginBottom: 6 },
    partner: { fontSize: 13, color: '#6200EE', fontWeight: '600', marginBottom: 4 },
    date: { fontSize: 11, color: '#BBB', marginTop: 4, textAlign: 'right' },
});

export default RepairCard;
