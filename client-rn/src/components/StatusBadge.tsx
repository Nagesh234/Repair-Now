/**
 * @file StatusBadge.tsx
 * @description Colour-coded status label for repair request status values.
 *
 * Supported statuses and their colours:
 *  - pending           → Amber
 *  - accepted          → Indigo
 *  - en_route          → Blue
 *  - diagnosing        → Purple
 *  - estimate_provided → Deep Purple
 *  - repairing         → Light Blue
 *  - completed         → Green
 *  - cancelled         → Red
 *  - (other)           → Grey
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

/** Colour configuration for a given status. */
interface StatusConfig {
    backgroundColor: string;
    textColor: string;
    label: string;
}

/**
 * Maps backend status strings to display configuration.
 * All status keys are lowercase to simplify matching.
 */
const STATUS_MAP: Record<string, StatusConfig> = {
    pending: { backgroundColor: '#FFF3E0', textColor: '#E65100', label: 'Pending' },
    accepted: { backgroundColor: '#E8EAF6', textColor: '#3F51B5', label: 'Accepted' },
    en_route: { backgroundColor: '#E3F2FD', textColor: '#1976D2', label: 'En Route' },
    diagnosing: { backgroundColor: '#F3E5F5', textColor: '#7B1FA2', label: 'Diagnosing' },
    estimate_provided: { backgroundColor: '#EDE7F6', textColor: '#512DA8', label: 'Review Estimate' },
    repairing: { backgroundColor: '#E1F5FE', textColor: '#0288D1', label: 'Repairing' },
    completed: { backgroundColor: '#E8F5E9', textColor: '#2E7D32', label: 'Completed' },
    cancelled: { backgroundColor: '#FFEBEE', textColor: '#C62828', label: 'Cancelled' },
};

/** Default config used when the status value is unrecognised. */
const DEFAULT_STATUS: StatusConfig = {
    backgroundColor: '#F5F5F5',
    textColor: '#757575',
    label: 'Unknown',
};

interface StatusBadgeProps {
    /** The repair status string from the backend (e.g. 'in_progress'). */
    status: string;
}

/**
 * StatusBadge component.
 * Renders a small pill-shaped chip with the human-readable status
 * and an appropriate background/text colour.
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const config = STATUS_MAP[status.toLowerCase()] ?? {
        ...DEFAULT_STATUS,
        label: status.replace(/_/g, ' '),
    };

    return (
        <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
            <Text style={[styles.text, { color: config.textColor }]}>{config.label}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 20,
    },
    text: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});

export default StatusBadge;
