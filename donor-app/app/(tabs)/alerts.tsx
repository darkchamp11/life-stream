/**
 * Alerts Tab — Emergency Blood Request Alerts
 * 
 * Real-time Firebase subscription for emergency requests.
 * Shows accept/decline for compatible blood types.
 * Includes hospital location display and Google Maps navigation.
 * Uses useEmergencyAlerts ViewModel.
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Vibration,
    ScrollView,
    Linking,
    Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEmergencyAlerts } from '../../src/viewmodels/useEmergencyAlerts';

const DONOR_STORAGE_KEY = '@lifestream_donor';

/**
 * Open Google Maps with directions to a location
 */
function openGoogleMaps(lat: number, lng: number, label?: string) {
    const encodedLabel = encodeURIComponent(label || 'Hospital');
    const url = Platform.select({
        ios: `maps://app?daddr=${lat},${lng}&dirflg=d`,
        android: `google.navigation:q=${lat},${lng}&mode=d`,
        default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodedLabel}&travelmode=driving`,
    });

    Linking.canOpenURL(url!).then((supported) => {
        if (supported) {
            Linking.openURL(url!);
        } else {
            // Fallback to web Google Maps
            Linking.openURL(
                `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
            );
        }
    });
}

export default function AlertsTab() {
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
        responseStatus,
        isSelected,
        acceptRequest,
        declineRequest,
    } = useEmergencyAlerts(donorId, donorBloodType);

    // Vibrate on new compatible alert
    useEffect(() => {
        if (activeRequest && isCompatible && responseStatus === null) {
            Vibration.vibrate([0, 500, 200, 500]);
        }
    }, [activeRequest, isCompatible, responseStatus]);

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

    const hospitalLat = activeRequest.hospitalLocation?.lat;
    const hospitalLng = activeRequest.hospitalLocation?.lng;
    const hasHospitalLocation = hospitalLat !== undefined && hospitalLng !== undefined;

    // Not compatible
    if (!isCompatible) {
        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
            </ScrollView>
        );
    }

    // Selection result — SELECTED (show prominent navigation)
    if (isSelected === true && responseStatus === 'accepted') {
        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <View style={[styles.alertCard, styles.selectedCard]}>
                    <Text style={styles.resultIcon}>✅</Text>
                    <Text style={styles.resultTitle}>You have been selected!</Text>
                    <Text style={styles.resultSubtitle}>
                        Please proceed to the hospital. Your live location is being shared.
                    </Text>
                </View>

                {/* Hospital Navigation Card */}
                {hasHospitalLocation && (
                    <View style={styles.navigationCard}>
                        <Text style={styles.navTitle}>🏥 Hospital Location</Text>
                        <Text style={styles.navHospitalName}>{activeRequest.hospitalName}</Text>

                        <View style={styles.navCoords}>
                            <View style={styles.coordItem}>
                                <Text style={styles.coordLabel}>Latitude</Text>
                                <Text style={styles.coordValue}>{hospitalLat.toFixed(6)}</Text>
                            </View>
                            <View style={styles.coordItem}>
                                <Text style={styles.coordLabel}>Longitude</Text>
                                <Text style={styles.coordValue}>{hospitalLng.toFixed(6)}</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.navigateButton}
                            onPress={() => openGoogleMaps(hospitalLat, hospitalLng, activeRequest.hospitalName)}
                        >
                            <Text style={styles.navigateButtonText}>
                                🗺️ Open in Google Maps
                            </Text>
                        </TouchableOpacity>

                        <Text style={styles.navHint}>
                            Tap to get turn-by-turn directions to the hospital
                        </Text>
                    </View>
                )}

                {/* Live tracking indicator */}
                <View style={styles.trackingBanner}>
                    <ActivityIndicator color="#4ade80" size="small" />
                    <Text style={styles.trackingText}>
                        Your live location is being shared with the hospital
                    </Text>
                </View>
            </ScrollView>
        );
    }

    // Selection result — NOT SELECTED
    if (isSelected === false && responseStatus === 'accepted') {
        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <View style={[styles.alertCard, styles.notSelectedCard]}>
                    <Text style={styles.resultIcon}>🔄</Text>
                    <Text style={styles.resultTitle}>Not selected this time</Text>
                    <Text style={styles.resultSubtitle}>
                        Thank you for your willingness to help. Stay available for future requests.
                    </Text>
                </View>
            </ScrollView>
        );
    }

    // Active compatible request — show full details with hospital location
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Emergency Banner */}
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

                {/* Details Grid */}
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
                        <Text style={[styles.detailValue, styles.urgentText]}>
                            {activeRequest.urgency?.toUpperCase() || 'CRITICAL'}
                        </Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Your Blood Type</Text>
                        <Text style={[styles.detailValue, styles.compatibleText]}>{donorBloodType} ✓</Text>
                    </View>
                </View>

                {/* Hospital Location Section */}
                {hasHospitalLocation && (
                    <View style={styles.hospitalLocationSection}>
                        <Text style={styles.sectionTitle}>🏥 Hospital Location</Text>

                        {/* Map View */}
                        <View style={styles.mapContainer}>
                            <MapView
                                style={styles.map}
                                provider={PROVIDER_GOOGLE}
                                initialRegion={{
                                    latitude: hospitalLat,
                                    longitude: hospitalLng,
                                    latitudeDelta: 0.05,
                                    longitudeDelta: 0.05,
                                }}
                                scrollEnabled={false}
                                zoomEnabled={false}
                            >
                                <Marker
                                    coordinate={{
                                        latitude: hospitalLat,
                                        longitude: hospitalLng,
                                    }}
                                    title={activeRequest.hospitalName}
                                    description="Blood needed here"
                                    pinColor="red"
                                />
                            </MapView>
                        </View>

                        <View style={styles.navCoords}>
                            <View style={styles.coordItem}>
                                <Text style={styles.coordLabel}>Lat</Text>
                                <Text style={styles.coordValue}>{hospitalLat.toFixed(6)}</Text>
                            </View>
                            <View style={styles.coordItem}>
                                <Text style={styles.coordLabel}>Lng</Text>
                                <Text style={styles.coordValue}>{hospitalLng.toFixed(6)}</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.viewMapButton}
                            onPress={() => openGoogleMaps(hospitalLat, hospitalLng, activeRequest.hospitalName)}
                        >
                            <Text style={styles.viewMapButtonText}>📍 Open in Google Maps</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Action Buttons */}
                {responseStatus === null ? (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.acceptButton} onPress={acceptRequest}>
                            <Text style={styles.acceptButtonText}>✓ Accept & Share Location</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.declineButton} onPress={declineRequest}>
                            <Text style={styles.declineButtonText}>✗ Decline</Text>
                        </TouchableOpacity>
                    </View>
                ) : responseStatus === 'declined' ? (
                    <View style={[styles.respondedBanner, styles.declinedBanner]}>
                        <Text style={styles.declinedText}>
                            You have declined this request. Thank you for staying active.
                        </Text>
                    </View>
                ) : (
                    <View>
                        <View style={styles.respondedBanner}>
                            <ActivityIndicator color="#4ade80" size="small" />
                            <Text style={styles.respondedText}>
                                Response sent — Waiting for hospital confirmation...
                            </Text>
                        </View>

                        {/* Show Navigate button even while waiting */}
                        {hasHospitalLocation && (
                            <TouchableOpacity
                                style={[styles.navigateButton, { marginTop: 12 }]}
                                onPress={() => openGoogleMaps(hospitalLat, hospitalLng, activeRequest.hospitalName)}
                            >
                                <Text style={styles.navigateButtonText}>
                                    🗺️ Navigate to Hospital
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0c0a09',
    },
    content: {
        padding: 16,
        paddingTop: 60,
        paddingBottom: 40,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
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
        paddingHorizontal: 20,
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
        marginBottom: 12,
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
        marginBottom: 16,
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

    // Hospital Location Section
    hospitalLocationSection: {
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.25)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#93c5fd',
        marginBottom: 10,
    },
    mapContainer: {
        height: 150,
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    navCoords: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 10,
    },
    coordItem: {
        flex: 1,
        backgroundColor: 'rgba(39, 39, 42, 0.5)',
        borderRadius: 8,
        padding: 10,
    },
    coordLabel: {
        fontSize: 10,
        color: '#71717a',
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    coordValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#d4d4d8',
        fontFamily: 'monospace',
    },
    viewMapButton: {
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.3)',
        borderRadius: 10,
        padding: 10,
        alignItems: 'center',
    },
    viewMapButtonText: {
        color: '#93c5fd',
        fontSize: 14,
        fontWeight: '600',
    },

    // Navigation Card (post-selection)
    navigationCard: {
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.3)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
    },
    navTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#93c5fd',
        marginBottom: 4,
    },
    navHospitalName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
    },
    navigateButton: {
        backgroundColor: '#2563eb',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    navigateButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },
    navHint: {
        fontSize: 12,
        color: '#71717a',
        textAlign: 'center',
        marginTop: 8,
    },

    // Tracking Banner
    trackingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(74, 222, 128, 0.3)',
    },
    trackingText: {
        flex: 1,
        color: '#4ade80',
        fontSize: 13,
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
    declinedBanner: {
        backgroundColor: 'rgba(113, 113, 122, 0.1)',
        borderColor: 'rgba(113, 113, 122, 0.3)',
    },
    respondedText: {
        flex: 1,
        color: '#4ade80',
        fontSize: 14,
    },
    declinedText: {
        flex: 1,
        color: '#a1a1aa',
        fontSize: 14,
        textAlign: 'center',
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
