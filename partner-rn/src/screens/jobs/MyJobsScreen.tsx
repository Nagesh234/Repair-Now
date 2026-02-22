/**
 * @file MyJobsScreen.tsx
 * @description Shows the partner's accepted repair jobs and allows marking them complete.
 *
 * Data flow:
 *  Mount → repairApi.getPartnerJobs → displays list of in-progress/completed repairs.
 *  "Mark Complete" → repairApi.completeRepair → updates UI status to 'completed'.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert, FlatList, RefreshControl, Modal, TextInput,
    StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { getPartnerJobs, completeRepair, updateRepairStatus, provideEstimate } from '../../api/repairApi';
import { getSession } from '../../store/sessionStore';
import { Repair } from '../../types/models';
import RepairCard from '../../components/RepairCard';
import LocationTracker from '../../components/LocationTracker';

/**
 * MyJobsScreen component.
 * Loads and displays all jobs assigned to the logged-in partner,
 * and allows marking in-progress jobs as complete.
 */
const MyJobsScreen: React.FC = () => {
    const [jobs, setJobs] = useState<Repair[]>([]);
    const [partnerId, setPartnerId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    /** The repair ID currently processing a status change. */
    const [actionId, setActionId] = useState<string | null>(null);

    // Estimate submission state
    const [estimateModalVisible, setEstimateModalVisible] = useState(false);
    const [estimateCost, setEstimateCost] = useState('');
    const [selectedRepairId, setSelectedRepairId] = useState<string | null>(null);
    const [submittingEstimate, setSubmittingEstimate] = useState(false);

    useEffect(() => {
        const loadSession = async () => {
            const session = await getSession();
            if (session) { setPartnerId(session.userId); }
        };
        loadSession();
    }, []);

    /**
     * Fetch all jobs assigned to this partner from the backend.
     * @param refreshing - `true` when triggered by pull-to-refresh.
     */
    const loadJobs = useCallback(async (refreshing = false): Promise<void> => {
        if (!partnerId) { return; }
        refreshing ? setIsRefreshing(true) : setIsLoading(true);
        try {
            const res = await getPartnerJobs(partnerId);
            setJobs(res.data.repairs ?? []);
        } catch {
            Alert.alert('Error', 'Could not load your jobs. Please try again.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [partnerId]);

    useEffect(() => { if (partnerId) { loadJobs(); } }, [partnerId, loadJobs]);

    /**
     * Marks a job as complete and updates the UI without a full reload.
     * @param repairId - The ID of the repair to complete.
     */
    const handleComplete = async (repairId: string): Promise<void> => {
        setActionId(repairId);
        try {
            await completeRepair(repairId);
            setJobs(prev =>
                prev.map(job => job.id === repairId ? { ...job, status: 'completed' } : job),
            );
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.error ?? 'Could not complete the job.');
        } finally {
            setActionId(null);
        }
    };

    /**
     * Updates the status of a repair (e.g. accepted -> en_route -> diagnosing).
     */
    const handleUpdateStatus = async (repairId: string, newStatus: string): Promise<void> => {
        setActionId(repairId);
        try {
            await updateRepairStatus(repairId, { status: newStatus });
            setJobs(prev =>
                prev.map(job => job.id === repairId ? { ...job, status: newStatus } : job),
            );
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.error ?? 'Could not update status.');
        } finally {
            setActionId(null);
        }
    };

    /**
     * Submits an estimate for a `diagnosing` job.
     */
    const handleProvideEstimate = async (): Promise<void> => {
        if (!selectedRepairId || !estimateCost) return;
        const costStr = estimateCost.replace(/,/g, '');
        const cost = parseFloat(costStr);
        if (isNaN(cost) || cost <= 0) {
            Alert.alert('Invalid', 'Please enter a valid cost.');
            return;
        }

        setSubmittingEstimate(true);
        try {
            await provideEstimate(selectedRepairId, { estimated_cost: cost });
            setJobs(prev => prev.map(job =>
                job.id === selectedRepairId
                    ? { ...job, status: 'estimate_provided', estimated_cost: cost }
                    : job
            ));
            setEstimateModalVisible(false);
            setEstimateCost('');
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.error ?? 'Could not submit estimate.');
        } finally {
            setSubmittingEstimate(false);
            setSelectedRepairId(null);
        }
    };

    if (isLoading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="#00897B" /></View>;
    }

    return (
        <View style={styles.container}>
            {/* ── Screen Header ───────────────────────────── */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Jobs</Text>
            </View>

            <FlatList
                data={jobs}
                keyExtractor={item => item.id}
                contentContainerStyle={jobs.length ? styles.list : styles.emptyList}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={() => loadJobs(true)} colors={['#00897B']} />
                }
                renderItem={({ item }) => (
                    <View>
                        <RepairCard repair={item} />
                        {/* Workflow action buttons rendered sequentially based on status */}

                        {item.status === 'accepted' && (
                            <TouchableOpacity
                                style={[styles.actionBtn, actionId === item.id && styles.actionBtnOff, { backgroundColor: '#1976D2' }]}
                                onPress={() => handleUpdateStatus(item.id, 'en_route')}
                                disabled={actionId !== null}>
                                {actionId === item.id ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.actionBtnText}>🚗 Start Journey (En Route)</Text>}
                            </TouchableOpacity>
                        )}

                        {item.status === 'en_route' && (
                            <>
                                <LocationTracker repairId={item.id} />
                                <TouchableOpacity
                                    style={[styles.actionBtn, actionId === item.id && styles.actionBtnOff, { backgroundColor: '#7B1FA2' }]}
                                    onPress={() => handleUpdateStatus(item.id, 'diagnosing')}
                                    disabled={actionId !== null}>
                                    {actionId === item.id ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.actionBtnText}>🔍 Arrived: Start Diagnosing</Text>}
                                </TouchableOpacity>
                            </>
                        )}

                        {item.status === 'diagnosing' && (
                            <TouchableOpacity
                                style={[styles.actionBtn, actionId === item.id && styles.actionBtnOff, { backgroundColor: '#512DA8' }]}
                                onPress={() => { setSelectedRepairId(item.id); setEstimateModalVisible(true); }}
                                disabled={actionId !== null}>
                                {actionId === item.id ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.actionBtnText}>📝 Provide Estimate</Text>}
                            </TouchableOpacity>
                        )}

                        {/* Show waiting msg for estimate_provided */}
                        {item.status === 'estimate_provided' && (
                            <View style={styles.infoBox}>
                                <Text style={styles.infoText}>Waiting for client to approve estimate...</Text>
                            </View>
                        )}

                        {/* Note: Legacy 'in_progress' is treated like 'diagnosing' just so partners can still estimate any old ones */}
                        {item.status === 'in_progress' && (
                            <TouchableOpacity
                                style={[styles.actionBtn, actionId === item.id && styles.actionBtnOff, { backgroundColor: '#512DA8' }]}
                                onPress={() => { setSelectedRepairId(item.id); setEstimateModalVisible(true); }}
                                disabled={actionId !== null}>
                                {actionId === item.id ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.actionBtnText}>📝 Provide Estimate</Text>}
                            </TouchableOpacity>
                        )}

                        {/* Show "Mark Complete" ONLY for repairing jobs */}
                        {item.status === 'repairing' && (
                            <TouchableOpacity
                                style={[styles.actionBtn, actionId === item.id && styles.actionBtnOff, { backgroundColor: '#2E7D32' }]}
                                onPress={() => handleComplete(item.id)}
                                disabled={actionId !== null}
                                accessibilityRole="button">
                                {actionId === item.id ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.actionBtnText}>✓ Mark as Complete</Text>}
                            </TouchableOpacity>
                        )}
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Text style={styles.emptyText}>No jobs assigned yet.</Text>
                        <Text style={styles.emptySubText}>Accept jobs from the Available tab.</Text>
                    </View>
                }
            />

            {/* ── Estimate Modal ──────────────────────────── */}
            <Modal
                visible={estimateModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setEstimateModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Provide Estimate (₹)</Text>
                        <Text style={styles.modalSub}>Enter the estimated cost for this repair job.</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="e.g. 1500"
                            keyboardType="numeric"
                            value={estimateCost}
                            onChangeText={setEstimateCost}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setEstimateModalVisible(false)}>
                                <Text style={styles.modalBtnCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalBtnSubmit} onPress={handleProvideEstimate} disabled={submittingEstimate}>
                                {submittingEstimate ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.modalBtnSubmitText}>Submit</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0FDF8' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        backgroundColor: '#00897B', paddingHorizontal: 20,
        paddingTop: 52, paddingBottom: 20,
    },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFF' },
    list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
    emptyList: { flex: 1, paddingHorizontal: 16 },
    emptyText: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
    emptySubText: { fontSize: 13, color: '#999' },
    actionBtn: {
        marginHorizontal: 16, marginBottom: 16, marginTop: -8,
        paddingVertical: 12, borderRadius: 10, alignItems: 'center',
    },
    actionBtnOff: { opacity: 0.6 },
    actionBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
    infoBox: {
        backgroundColor: '#E8EAF6', marginHorizontal: 16, marginBottom: 16, marginTop: -8,
        paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderColor: '#C5CAE9', borderWidth: 1
    },
    infoText: { color: '#283593', fontWeight: '600', fontSize: 13 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#FFF', width: '85%', borderRadius: 16, padding: 24, elevation: 5 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 8 },
    modalSub: { fontSize: 13, color: '#666', marginBottom: 16 },
    modalInput: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    modalBtnCancel: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#F5F5F5' },
    modalBtnCancelText: { color: '#666', fontWeight: '600' },
    modalBtnSubmit: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#00897B', justifyContent: 'center', minWidth: 80, alignItems: 'center' },
    modalBtnSubmitText: { color: '#FFF', fontWeight: '700' },
});

export default MyJobsScreen;
