/**
 * @file HomeScreen.tsx
 * @description Home screen for the Repair Now Client app.
 *
 * Displays:
 *  - A personalised welcome header with the user's name.
 *  - A scrollable list of the client's repair requests as RepairCard items.
 *  - A floating action button to create a new repair request.
 *  - Pull-to-refresh to reload repairs from the backend.
 *
 * Data flow: HomeScreen → repairApi.getClientRepairs → renders RepairCard list.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { getClientRepairs, approveEstimate, rateRepair } from '../../api/repairApi';
import { getSession, clearSession } from '../../store/sessionStore';
import { Repair } from '../../types/models';
import RepairCard from '../../components/RepairCard';
import TrackingMap from '../../components/TrackingMap';
import RatingDialog from '../../components/RatingDialog';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'> & {
    /** Called after the user taps Logout so App.tsx clears the FCM userId. */
    onLogout: () => void;
};

/**
 * HomeScreen component.
 * Loads the client's repairs on mount and on pull-to-refresh.
 */
const HomeScreen: React.FC<Props> = ({ navigation, onLogout }) => {
    const [userName, setUserName] = useState('');
    const [userId, setUserId] = useState('');
    const [repairs, setRepairs] = useState<Repair[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [approvingId, setApprovingId] = useState<string | null>(null);

    /** Track which completed job to show the Rating dialog for. */
    const [ratingRepair, setRatingRepair] = useState<Repair | null>(null);

    /** Load session info on mount. */
    useEffect(() => {
        const loadSession = async () => {
            const session = await getSession();
            if (session) {
                setUserName(session.name);
                setUserId(session.userId);
            }
        };
        loadSession();
    }, []);

    /**
     * Fetch the client's repair list from the backend.
     * @param refreshing - `true` when triggered by pull-to-refresh.
     */
    const loadRepairs = useCallback(async (refreshing = false): Promise<void> => {
        if (!userId) { return; }
        refreshing ? setIsRefreshing(true) : setIsLoading(true);
        try {
            const res = await getClientRepairs(userId);
            setRepairs(res.data.repairs ?? []);
        } catch {
            Alert.alert('Error', 'Could not load repairs. Please check your connection.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [userId]);

    // Load repairs whenever userId is known
    useEffect(() => {
        if (userId) { loadRepairs(); }
    }, [userId, loadRepairs]);

    /** Approve an estimate given by a partner */
    const handleApproveEstimate = async (repairId: string): Promise<void> => {
        setApprovingId(repairId);
        try {
            await approveEstimate(repairId);
            setRepairs(prev => prev.map(job =>
                job.id === repairId ? { ...job, status: 'repairing' } : job
            ));
            Alert.alert('Approved', 'Estimate approved. The partner will begin the repair.');
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.error ?? 'Could not approve estimate.');
        } finally {
            setApprovingId(null);
        }
    };



    /** Clears the local session and navigates back to the Login screen. */
    const handleLogout = async (): Promise<void> => {
        await clearSession();
        onLogout();
        navigation.replace('Login');
    };

    // ── Empty / Loading States ───────────────────────────────────────────────

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#6200EE" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* ── Top bar ─────────────────────────────────── */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hello, {userName} 👋</Text>
                    <Text style={styles.subGreeting}>Your repair requests</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => navigation.navigate('Profile')}
                        accessibilityLabel="Edit Profile">
                        <Text style={styles.iconBtnText}>👤</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={handleLogout}
                        accessibilityLabel="Logout">
                        <Text style={styles.iconBtnText}>🚪</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── Repairs List ─────────────────────────────── */}
            <FlatList
                data={repairs}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={styles.cardContainer}>
                        <RepairCard repair={item} />
                        {item.status === 'estimate_provided' && (
                            <TouchableOpacity
                                style={[styles.approveBtn, approvingId === item.id && styles.approveBtnDisabled]}
                                onPress={() => handleApproveEstimate(item.id)}
                                disabled={approvingId !== null}
                            >
                                {approvingId === item.id ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Text style={styles.approveBtnText}>Approve Estimate</Text>
                                )}
                            </TouchableOpacity>
                        )}
                        {item.status === 'completed' && !item.rated && (
                            <TouchableOpacity
                                style={styles.rateBtn}
                                onPress={() => setRatingRepair(item)}
                                accessibilityLabel="Rate this repair">
                                <Text style={styles.rateBtnText}>⭐ Rate This Service</Text>
                            </TouchableOpacity>
                        )}
                        {item.status === 'en_route' && (
                            <TrackingMap repairId={item.id} address={item.address} />
                        )}
                        {item.status === 'pending' && (
                            <View style={styles.pendingBanner}>
                                <Text style={styles.pendingText}>Waiting for a partner to accept...</Text>
                            </View>
                        )}
                    </View>
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => loadRepairs(true)}
                        colors={['#6200EE']}
                    />
                }
                contentContainerStyle={repairs.length === 0 ? styles.emptyList : styles.list}
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Text style={styles.emptyText}>No repair requests yet.</Text>
                        <Text style={styles.emptySubText}>Tap + to submit your first request.</Text>
                    </View>
                }
            />

            {/* ── Floating Action Button ────────────────────── */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('RepairRequest')}
                accessibilityRole="button"
                accessibilityLabel="New Repair Request">
                <Text style={styles.fabText}>＋</Text>
            </TouchableOpacity>

            {/* ── Rating Dialog ─────────────────────────── */}
            {ratingRepair && (
                <RatingDialog
                    repairId={ratingRepair.id}
                    repairTitle={ratingRepair.title}
                    visible={true}
                    onClose={() => {
                        // Mark this repair as rated locally so the button disappears
                        setRepairs(prev => prev.map(r =>
                            r.id === ratingRepair.id ? { ...r, rated: true } : r
                        ));
                        setRatingRepair(null);
                    }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#6200EE', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20,
    },
    greeting: { fontSize: 22, fontWeight: '700', color: '#FFF' },
    subGreeting: { fontSize: 13, color: '#D6BFFF', marginTop: 2 },
    headerActions: { flexDirection: 'row', gap: 8 },
    iconBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
        width: 36, height: 36, justifyContent: 'center', alignItems: 'center',
    },
    iconBtnText: { fontSize: 16 },
    list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 },
    emptyList: { flex: 1, paddingHorizontal: 16 },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
    emptySubText: { fontSize: 14, color: '#999' },
    fab: {
        position: 'absolute', bottom: 24, right: 24,
        backgroundColor: '#6200EE', width: 56, height: 56, borderRadius: 28,
        justifyContent: 'center', alignItems: 'center',
        elevation: 6, shadowColor: '#6200EE', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    },
    fabText: { fontSize: 28, color: '#FFF', lineHeight: 32 },
    cardContainer: {
        marginBottom: 4,
    },
    approveBtn: {
        backgroundColor: '#6200EE',
        marginHorizontal: 16,
        marginBottom: 16,
        marginTop: -8,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        elevation: 2,
    },
    approveBtnDisabled: {
        backgroundColor: '#B388FF',
    },
    approveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
    rateBtn: {
        backgroundColor: '#FFB300', marginHorizontal: 16, marginBottom: 16, marginTop: -8,
        paddingVertical: 12, borderRadius: 10, alignItems: 'center', elevation: 2,
    },
    rateBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
    pendingBanner: {
        backgroundColor: '#F3E5F5',
        marginHorizontal: 16,
        marginBottom: 16,
        marginTop: -8,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    pendingText: { color: '#4A148C', fontWeight: '600', fontSize: 13 },
});

export default HomeScreen;
