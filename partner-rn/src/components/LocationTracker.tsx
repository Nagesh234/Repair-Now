/**
 * @file LocationTracker.tsx
 * @description Background/Foreground component that acquires GPS coordinates
 * and streams them to the server via Socket.io during the 'en_route' status.
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Alert, PermissionsAndroid, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import io, { Socket } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://10.0.2.2:3000'; // Target the local Node server

interface LocationTrackerProps {
    repairId: string;
    onStop?: () => void;
}

const LocationTracker: React.FC<LocationTrackerProps> = ({ repairId, onStop }) => {
    const socketRef = useRef<Socket | null>(null);
    const watchIdRef = useRef<number | null>(null);

    useEffect(() => {
        // Init socket
        const socket = io(SOCKET_SERVER_URL);
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Connected to Tracking Socket:', socket.id);
            socket.emit('join_repair_room', repairId);
        });

        // Request location permission then start tracking
        const startTracking = async () => {
            // On Android, show the OS permission dialog if not already granted.
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: 'Location Permission Required',
                        message:
                            'Repair Now Partner needs your location to show customers ' +
                            'where you are while you are on the way to a job.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    },
                );

                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    Alert.alert(
                        'Location Denied',
                        'Live tracking is disabled. Customers cannot see your location.',
                    );
                    return; // Do not start watchPosition
                }
            }

            watchIdRef.current = Geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    socket.emit('location_update', {
                        repairId,
                        latitude,
                        longitude,
                    });
                },
                (error) => {
                    console.warn('Geolocation Error', error);
                },
                {
                    enableHighAccuracy: true,
                    distanceFilter: 10, // Update every 10 meters
                    interval: 5000,
                    fastestInterval: 2000,
                }
            );
        };

        startTracking();

        // Cleanup
        return () => {
            if (watchIdRef.current !== null) {
                Geolocation.clearWatch(watchIdRef.current);
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [repairId]);

    return (
        <View style={styles.banner}>
            <View style={styles.dot} />
            <Text style={styles.bannerText}>Live Tracking Enabled (En Route)</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        padding: 10,
        borderRadius: 8,
        marginHorizontal: 16,
        marginBottom: 16,
        borderColor: '#C8E6C9',
        borderWidth: 1,
    },
    dot: {
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: '#4CAF50',
        marginRight: 8,
    },
    bannerText: {
        color: '#2E7D32',
        fontWeight: '600',
        fontSize: 13,
    },
});

export default LocationTracker;
