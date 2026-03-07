/**
 * AlertsScreen — Screen 3
 * 
 * Displays nearby emergency blood requests.
 * Shows accept/decline buttons for compatible requests.
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Vibration,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEmergencyAlerts } from '../../viewmodels/useEmergencyAlerts';

const DONOR_STORAGE_KEY = '@lifestream_donor';

export default function AlertsScreen() {
    const [donorId, setDonorId] = useState('');
    const [donorBloodType, setDonorBloodType] = useState('O+');

    // Load donor info
    useEffect(() => {
        const load = async () => {
            const data = await AsyncStorage.getItem(DONOR_STORAGE_KEY);
            if (data) {
                const donor = JSON.parse(data);
                setDonorId(donor.id);
                setDonorBloodType(donor.bloodType);
            }
        };
        load();
    }, []);

    const {
        activeRequest,
        isCompatible,
        hasResponded,
        isSelected,
        acceptRequest,
        declineRequest,
    } = useEmergencyAlerts(donorId, donorBloodType);

    // Vibrate on new compatible alert
    useEffect(() => {
        if (activeRequest && isCompatible && !hasResponded) {
            Vibration.vibrate([0, 500, 200, 500]);
        }
    }, [activeRequest, isCompatible, hasResponded]);

    // No active request
    if (!activeRequest) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyState}>
                    <View style={styles.emptyIcon}>
                        <Text style={styles.emptyIconText}>🔔</Text>
                    </View>
                    <Text style={styles.emptyTitle}>No Active Alerts</Text>
                    <Text style={styles.emptySubtitle}>
                        Emergency blood requests will appear here in real-time
                    </Text>
                    <View style={styles.pulseContainer}>
                        <View style={styles.pulseOuter}>
                            <View style={styles.pulseInner} />
                        </View>
                        <Text style={styles.pulseText}>Listening for emergencies...</Text>
                    </View>
                </View>
            </View>
        );
    }

    // Not compatible
    if (!isCompatible) {
        return (
            <View style={styles.container}>
                <View style={styles.alertCard}>
                    <View style={styles.alertHeader}>
                        <Text style={styles.alertLabel}>EMERGENCY REQUEST</Text>
                        <View style={styles.bloodBadge}>
                            <Text style={styles.bloodBadgeText}>{activeRequest.bloodType}</Text>
                        </View>
                    </View>
                    <Text style={styles.hospitalName}>{activeRequest.hospitalName}</Text>
                    <View style={styles.incompatibleBanner}>
                        <Text style={styles.incompatibleText}>
                            Not compatible with your blood type ({donorBloodType})
                        </Text>
                    </View>
                </View>
            </View>
        );
    }

    // Selection result
    if (isSelected !== null && hasResponded) {
        return (
            <View style={styles.container}>
                <View style={[styles.alertCard, isSelected ? styles.selectedCard : styles.notSelectedCard]}>
                    <Text style={styles.resultIcon}>{isSelected ? '✅' : '🔄'}</Text>
                    <Text style={styles.resultTitle}>
                        {isSelected ? 'You have been selected!' : 'Not selected this time'}
                    </Text>
                    <Text style={styles.resultSubtitle}>
                        {isSelected
                            ? 'Please proceed to the hospital. Your live location is being shared.'
                            : 'Thank you for your willingness to help. Stay available for future requests.'}
                    </Text>
                </View>
            </View>
        );
    }

    // Active compatible request
    return (
        <View style={styles.container}>
            {/* Emergency Alert */}
            <View style={styles.emergencyBanner}>
                <Text style={styles.emergencyText}>🚨 EMERGENCY BLOOD REQUEST</Text>
            </View>

            <View style={styles.alertCard}>
                <View style={styles.alertHeader}>
                    <Text style={styles.alertLabel}>URGENT</Text>
                    <View style={styles.bloodBadgeLarge}>
                        <Text style={styles.bloodBadgeLargeText}>{activeRequest.bloodType}</Text>
                    </View>
                </View>

                <Text style={styles.hospitalName}>{activeRequest.hospitalName}</Text>

                <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Blood Type Needed</Text>
                        <Text style={styles.detailValue}>{activeRequest.bloodType}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Search Radius</Text>
                        <Text style={styles.detailValue}>{activeRequest.searchRadius || 15} km</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Urgency</Text>
                        <Text style={[styles.detailValue, styles.urgentText]}>{activeRequest.urgency?.toUpperCase() || 'CRITICAL'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Your Blood Type</Text>
                        <Text style={[styles.detailValue, styles.compatibleText]}>{donorBloodType} ✓</Text>
                    </View>
                </View>

                {/* Action Buttons */}
                {!hasResponded ? (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.acceptButton} onPress={acceptRequest}>
                            <Text style={styles.acceptButtonText}>✓ Accept & Share Location</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.declineButton} onPress={declineRequest}>
                            <Text style={styles.declineButtonText}>✗ Decline</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.respondedBanner}>
                        <ActivityIndicator color="#4ade80" size="small" />
                        <Text style={styles.respondedText}>
                            Response sent — Waiting for hospital confirmation...
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0c0a09',
        padding: 16,
        paddingTop: 60,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(63, 63, 70, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyIconText: {
        fontSize: 36,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#d4d4d8',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#71717a',
        textAlign: 'center',
        marginBottom: 32,
    },
    pulseContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    pulseOuter: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: 'rgba(74, 222, 128, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulseInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4ade80',
    },
    pulseText: {
        fontSize: 13,
        color: '#4ade80',
    },
    emergencyBanner: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.4)',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        marginBottom: 16,
    },
    emergencyText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: 'bold',
    },
    alertCard: {
        backgroundColor: 'rgba(24, 24, 27, 0.8)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#27272a',
    },
    selectedCard: {
        borderColor: 'rgba(74, 222, 128, 0.4)',
        backgroundColor: 'rgba(74, 222, 128, 0.05)',
    },
    notSelectedCard: {
        borderColor: 'rgba(113, 113, 122, 0.4)',
    },
    alertHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    alertLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#ef4444',
        letterSpacing: 1,
    },
    bloodBadge: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    bloodBadgeText: {
        color: '#ef4444',
        fontSize: 15,
        fontWeight: 'bold',
    },
    bloodBadgeLarge: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 14,
    },
    bloodBadgeLargeText: {
        color: '#ef4444',
        fontSize: 20,
        fontWeight: 'bold',
    },
    hospitalName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
    },
    incompatibleBanner: {
        backgroundColor: 'rgba(113, 113, 122, 0.15)',
        borderRadius: 10,
        padding: 12,
        marginTop: 8,
    },
    incompatibleText: {
        color: '#71717a',
        fontSize: 14,
        textAlign: 'center',
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
    },
    detailItem: {
        width: '46%',
        backgroundColor: 'rgba(39, 39, 42, 0.5)',
        borderRadius: 10,
        padding: 12,
    },
    detailLabel: {
        fontSize: 11,
        color: '#71717a',
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#d4d4d8',
    },
    urgentText: {
        color: '#ef4444',
    },
    compatibleText: {
        color: '#4ade80',
    },
    actionButtons: {
        gap: 10,
    },
    acceptButton: {
        backgroundColor: '#16a34a',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    acceptButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },
    declineButton: {
        backgroundColor: 'rgba(63, 63, 70, 0.5)',
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#3f3f46',
    },
    declineButtonText: {
        color: '#a1a1aa',
        fontSize: 15,
        fontWeight: '600',
    },
    respondedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(74, 222, 128, 0.3)',
    },
    respondedText: {
        flex: 1,
        color: '#4ade80',
        fontSize: 14,
    },
    resultIcon: {
        fontSize: 48,
        textAlign: 'center',
        marginBottom: 12,
    },
    resultTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    resultSubtitle: {
        fontSize: 14,
        color: '#a1a1aa',
        textAlign: 'center',
        lineHeight: 20,
    },
});
