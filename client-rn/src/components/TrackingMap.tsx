/**
 * @file TrackingMap.tsx
 * @description Renders a React Native Map centered on the partner's live location.
 * Listens to Socket.io events to move the marker when the partner is 'en_route'.
 */

import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import io, { Socket } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://10.0.2.2:3000'; // Target local Node server

interface TrackingMapProps {
    repairId: string;
    /** The client's original address (helps provide a fallback center) */
    address: string;
}

const TrackingMap: React.FC<TrackingMapProps> = ({ repairId, address }) => {
    const socketRef = useRef<Socket | null>(null);
    const mapRef = useRef<MapView | null>(null);

    // Default to a central coordinate until the partner streams their first location
    const [partnerLocation, setPartnerLocation] = useState<{ latitude: number, longitude: number } | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const socket = io(SOCKET_SERVER_URL);
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Client connected to tracking socket:', socket.id);
            setIsConnected(true);
            // Join the specific room for this repair
            socket.emit('join_repair_room', repairId);
        });

        socket.on('technician_location', (data: { latitude: number, longitude: number }) => {
            setPartnerLocation({ latitude: data.latitude, longitude: data.longitude });

            // Animate map to new location
            mapRef.current?.animateToRegion({
                latitude: data.latitude,
                longitude: data.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            }, 1000);
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        return () => {
            socket.disconnect();
        };
    }, [repairId]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.statusRow}>
                    <View style={[styles.dot, isConnected ? styles.dotConnected : styles.dotDisconnected]} />
                    <Text style={styles.statusText}>
                        {partnerLocation ? 'Partner is approaching...' : 'Waiting for partner location signal...'}
                    </Text>
                </View>
                <Text style={styles.addressText} numberOfLines={1}>Destination: {address}</Text>
            </View>

            <View style={styles.mapContainer}>
                {partnerLocation ? (
                    <MapView
                        ref={mapRef}
                        provider={PROVIDER_GOOGLE}
                        style={styles.map}
                        initialRegion={{
                            latitude: partnerLocation.latitude,
                            longitude: partnerLocation.longitude,
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05,
                        }}
                    >
                        <Marker
                            coordinate={partnerLocation}
                            title="Partner Technician"
                            description="En Route to your location"
                            image={require('../assets/car_icon.png')} // Create a tiny fallback below if missing
                        />
                    </MapView>
                ) : (
                    <View style={styles.placeholderMap}>
                        <Text style={styles.placeholderText}>Map will appear when partner starts journey</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFF',
        borderRadius: 14,
        marginHorizontal: 16,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 2,
    },
    header: {
        padding: 12,
        backgroundColor: '#E3F2FD',
        borderBottomWidth: 1,
        borderColor: '#BBDEFB',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    dotConnected: { backgroundColor: '#4CAF50' },
    dotDisconnected: { backgroundColor: '#F44336' },
    statusText: { fontSize: 13, fontWeight: '600', color: '#1565C0' },
    addressText: { fontSize: 12, color: '#555' },
    mapContainer: {
        height: 180,
        backgroundColor: '#EEE',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    placeholderMap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    placeholderText: {
        color: '#999',
        fontSize: 13,
    },
});

export default TrackingMap;
