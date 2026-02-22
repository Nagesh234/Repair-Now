/**
 * @file PartnerHomeScreen.tsx
 * @description Shows available (pending) repair requests to the logged-in partner.
 *
 * The partner can browse pending repairs and tap "Accept" to claim a job.
 * Accepted jobs then appear in the MyJobs tab.
 *
 * Data flow: PartnerHomeScreen → repairApi.getPendingRepairs → accept → repairApi.acceptRepair
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert, FlatList, RefreshControl,
    StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { getPendingRepairs, acceptRepair } from '../../api/repairApi';
import { getSession, clearSession } from '../../store/sessionStore';
import { Repair } from '../../types/models';
import RepairCard from '../../components/RepairCard';

type Props = NativeStackScreenProps<RootStackParamList, 'MainTabs'>;

/**
 * PartnerHomeScreen component.
 * Lists all pending repairs and allows the partner to accept them.
 */
const PartnerHomeScreen: React.FC<Props> = ({ navigation }) => {
    const [repairs, setRepairs] = useState<Repair[]>([]);
    const [partnerId, setPartnerId] = useState('');
    const [partnerName, setPartnerName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [kycPending, setKycPending] = useState(false);
    /** Tracks which repair IDs have an in-progress accept action. */
    const [acceptingId, setAcceptingId] = useState<string | null>(null);

    useEffect(() => {
        const loadSession = async () => {
            const session = await getSession();
            if (session) {
                setPartnerId(session.userId);
                setPartnerName(session.name);
            }
        };
        loadSession();
    }, []);

    /**
     * Fetch all pending repairs from the backend.
     * @param refreshing - `true` when triggered by pull-to-refresh.
     */
    const loadRepairs = useCallback(async (refreshing = false): Promise<void> => {
        if (!partnerId) { return; }
        refreshing ? setIsRefreshing(true) : setIsLoading(true);
        try {
            const res = await getPendingRepairs(partnerId);
            setRepairs(res.data.repairs ?? []);
            setKycPending(res.data.kyc_pending ?? false);
        } catch {
            Alert.alert('Error', 'Could not load available jobs. Please check your connection.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [partnerId]);

    useEffect(() => { if (partnerId) { loadRepairs(); } }, [partnerId, loadRepairs]);

    /**
     * Accepts a repair on behalf of the logged-in partner.
     * Removes the repair from the list on success (it moves to My Jobs).
     * @param repairId - The ID of the repair to accept.
     */
    const handleAccept = async (repairId: string): Promise<void> => {
        if (!partnerId) { return; }
        setAcceptingId(repairId);
        try {
            await acceptRepair(repairId, { partner_id: partnerId });
            // Remove from the available list after acceptance
            setRepairs(prev => prev.filter(r => r.id !== repairId));
            Alert.alert('Accepted!', 'The job has been added to My Jobs.');
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.error ?? 'Could not accept job.');
        } finally {
            setAcceptingId(null);
        }
    };

    /** Clears session and navigates to Login. */
    const handleLogout = async (): Promise<void> => {
        await clearSession();
        navigation.replace('Login');
    };

    if (isLoading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="#00897B" /></View>;
    }

    return (
        <View style={styles.container}>
            {/* ── Header ──────────────────────────────────── */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hello, {partnerName} 👋</Text>
                    <Text style={styles.subGreeting}>Available repair jobs</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.iconBtn}
                        onPress={() => navigation.navigate('Profile')} accessibilityLabel="Edit Profile">
                        <Text style={styles.iconBtnTxt}>👤</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn} onPress={handleLogout} accessibilityLabel="Logout">
                        <Text style={styles.iconBtnTxt}>🚪</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── Repairs List ─────────────────────────────── */}
            <FlatList
                data={repairs}
                keyExtractor={item => item.id}
                contentContainerStyle={repairs.length ? styles.list : styles.emptyList}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={() => loadRepairs(true)} colors={['#00897B']} />
                }
                renderItem={({ item }) => (
                    <View>
                        <RepairCard repair={item} />
                        {/* Accept button attached below each card */}
                        <TouchableOpacity
                            style={[styles.acceptBtn, acceptingId === item.id && styles.acceptBtnOff]}
                            onPress={() => handleAccept(item.id)}
                            disabled={acceptingId !== null}
                            accessibilityRole="button"
                            accessibilityLabel={`Accept ${item.title}`}>
                            {acceptingId === item.id
                                ? <ActivityIndicator color="#FFF" size="small" />
                                : <Text style={styles.acceptBtnText}>Accept Job</Text>}
                        </TouchableOpacity>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.centered}>
                        {kycPending ? (
                            <>
                                <Text style={styles.emptyText}>Account Pending Approval</Text>
                                <Text style={styles.emptySubText}>Your profile is under review by admins.</Text>
                            </>
                        ) : (
                            <>
                                <Text style={styles.emptyText}>No pending jobs right now.</Text>
                                <Text style={styles.emptySubText}>Pull down to refresh.</Text>
                            </>
                        )}
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0FDF8' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#00897B', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20,
    },
    greeting: { fontSize: 20, fontWeight: '700', color: '#FFF' },
    subGreeting: { fontSize: 12, color: '#B2EBE0', marginTop: 2 },
    headerActions: { flexDirection: 'row', gap: 8 },
    iconBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
        width: 36, height: 36, justifyContent: 'center', alignItems: 'center',
    },
    iconBtnTxt: { fontSize: 16 },
    list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 },
    emptyList: { flex: 1, paddingHorizontal: 16 },
    emptyText: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
    emptySubText: { fontSize: 13, color: '#999' },
    acceptBtn: {
        backgroundColor: '#00897B', marginHorizontal: 16, marginBottom: 16, marginTop: -8,
        paddingVertical: 12, borderRadius: 10, alignItems: 'center',
    },
    acceptBtnOff: { backgroundColor: '#80CBC4' },
    acceptBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});

export default PartnerHomeScreen;
