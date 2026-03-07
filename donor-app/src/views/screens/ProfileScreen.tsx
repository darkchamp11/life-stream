/**
 * ProfileScreen — Screen 2
 * 
 * Displays donor info and availability toggle.
 */

import React from 'react';
import {
    View,
    Text,
    Switch,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { useDonorProfile } from '../../viewmodels/useDonorProfile';

export default function ProfileScreen() {
    const { profile, isLoading, toggleAvailability } = useDonorProfile();

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color="#ef4444" size="large" />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={styles.center}>
                <Text style={styles.emptyText}>No profile found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Profile Header */}
            <View style={styles.header}>
                <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                        {profile.name.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.name}>{profile.name}</Text>
                <View style={styles.bloodBadge}>
                    <Text style={styles.bloodBadgeText}>{profile.bloodType}</Text>
                </View>
            </View>

            {/* Info Cards */}
            <View style={styles.card}>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Donor ID</Text>
                    <Text style={styles.infoValue}>{profile.id.slice(0, 15)}...</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Blood Type</Text>
                    <Text style={[styles.infoValue, styles.bloodText]}>{profile.bloodType}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Location</Text>
                    <Text style={styles.infoValueMono}>
                        {profile.latitude.toFixed(4)}, {profile.longitude.toFixed(4)}
                    </Text>
                </View>
            </View>

            {/* Availability Toggle */}
            <View style={styles.card}>
                <View style={styles.toggleRow}>
                    <View>
                        <Text style={styles.toggleLabel}>Available for Donation</Text>
                        <Text style={styles.toggleHint}>
                            {profile.availability
                                ? 'You will receive emergency alerts'
                                : 'Emergency alerts are paused'}
                        </Text>
                    </View>
                    <Switch
                        value={profile.availability}
                        onValueChange={toggleAvailability}
                        trackColor={{ false: '#3f3f46', true: '#dc2626' }}
                        thumbColor={profile.availability ? '#fff' : '#a1a1aa'}
                    />
                </View>
            </View>

            {/* Status Indicator */}
            <View style={[styles.statusBar, profile.availability ? styles.statusActive : styles.statusInactive]}>
                <View style={[styles.statusDot, profile.availability ? styles.dotActive : styles.dotInactive]} />
                <Text style={[styles.statusText, profile.availability ? styles.textActive : styles.textInactive]}>
                    {profile.availability ? 'Active — Ready for emergencies' : 'Inactive — Not receiving alerts'}
                </Text>
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
    center: {
        flex: 1,
        backgroundColor: '#0c0a09',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#71717a',
        fontSize: 16,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ef4444',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    bloodBadge: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    bloodBadgeText: {
        color: '#ef4444',
        fontSize: 18,
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: 'rgba(24, 24, 27, 0.8)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#27272a',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    infoLabel: {
        fontSize: 14,
        color: '#71717a',
    },
    infoValue: {
        fontSize: 14,
        color: '#d4d4d8',
        fontWeight: '500',
    },
    infoValueMono: {
        fontSize: 13,
        color: '#d4d4d8',
        fontFamily: 'monospace',
    },
    bloodText: {
        color: '#ef4444',
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: '#27272a',
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    toggleLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#d4d4d8',
        marginBottom: 4,
    },
    toggleHint: {
        fontSize: 12,
        color: '#71717a',
    },
    statusBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    statusActive: {
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        borderColor: 'rgba(74, 222, 128, 0.3)',
    },
    statusInactive: {
        backgroundColor: 'rgba(113, 113, 122, 0.1)',
        borderColor: 'rgba(113, 113, 122, 0.3)',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    dotActive: {
        backgroundColor: '#4ade80',
    },
    dotInactive: {
        backgroundColor: '#71717a',
    },
    statusText: {
        fontSize: 13,
        fontWeight: '500',
    },
    textActive: {
        color: '#4ade80',
    },
    textInactive: {
        color: '#71717a',
    },
});
