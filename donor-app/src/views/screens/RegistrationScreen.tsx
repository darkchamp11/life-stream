/**
 * RegistrationScreen — Screen 1
 * 
 * Donor registration form with:
 * - Name input
 * - Blood group dropdown
 * - Availability toggle
 * - "Get Current Location" button (expo-location)
 * - "Register Donor" button
 */

import React from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Switch,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
    Alert,
} from 'react-native';
import { useDonorRegistration } from '../../viewmodels/useDonorRegistration';
import type { BloodType } from '../../models/donor';

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

interface RegistrationScreenProps {
    onRegistered: () => void;
}

export default function RegistrationScreen({ onRegistered }: RegistrationScreenProps) {
    const {
        name,
        setName,
        bloodType,
        setBloodType,
        availability,
        setAvailability,
        location,
        isLoadingLocation,
        locationError,
        isRegistering,
        error,
        fetchLocation,
        register,
    } = useDonorRegistration();

    const handleRegister = async () => {
        const success = await register();
        if (success) {
            onRegistered();
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.iconCircle}>
                    <Text style={styles.iconText}>🩸</Text>
                </View>
                <Text style={styles.title}>
                    Become a <Text style={styles.titleHighlight}>Donor</Text>
                </Text>
                <Text style={styles.subtitle}>Join the emergency blood donation network</Text>
            </View>

            {/* Form Card */}
            <View style={styles.card}>
                {/* Name Input */}
                <View style={styles.field}>
                    <Text style={styles.label}>Your Name</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter your full name"
                        placeholderTextColor="#71717a"
                    />
                    <Text style={styles.hint}>
                        Your name is only revealed to hospitals after you accept a request
                    </Text>
                </View>

                {/* Blood Type Selector */}
                <View style={styles.field}>
                    <Text style={styles.label}>Blood Type</Text>
                    <View style={styles.bloodTypeGrid}>
                        {BLOOD_TYPES.map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[
                                    styles.bloodTypeButton,
                                    bloodType === type && styles.bloodTypeButtonActive,
                                ]}
                                onPress={() => setBloodType(type)}
                            >
                                <Text
                                    style={[
                                        styles.bloodTypeText,
                                        bloodType === type && styles.bloodTypeTextActive,
                                    ]}
                                >
                                    {type}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Availability Toggle */}
                <View style={styles.field}>
                    <View style={styles.toggleRow}>
                        <Text style={styles.label}>Available for Donation</Text>
                        <Switch
                            value={availability}
                            onValueChange={setAvailability}
                            trackColor={{ false: '#3f3f46', true: '#dc2626' }}
                            thumbColor={availability ? '#fff' : '#a1a1aa'}
                        />
                    </View>
                </View>

                {/* Get Location Button */}
                <View style={styles.field}>
                    <Text style={styles.label}>Location</Text>
                    <TouchableOpacity
                        style={styles.locationButton}
                        onPress={fetchLocation}
                        disabled={isLoadingLocation}
                    >
                        {isLoadingLocation ? (
                            <ActivityIndicator color="#ef4444" size="small" />
                        ) : (
                            <Text style={styles.locationButtonText}>
                                📍 {location ? 'Location Captured ✓' : 'Get Current Location'}
                            </Text>
                        )}
                    </TouchableOpacity>
                    {location && (
                        <Text style={styles.locationInfo}>
                            {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                        </Text>
                    )}
                    {locationError && (
                        <Text style={styles.errorText}>{locationError}</Text>
                    )}
                </View>

                {/* Error */}
                {error && (
                    <Text style={styles.errorText}>{error}</Text>
                )}

                {/* Register Button */}
                <TouchableOpacity
                    style={[styles.registerButton, (!name.trim() || !location) && styles.registerButtonDisabled]}
                    onPress={handleRegister}
                    disabled={isRegistering || !name.trim() || !location}
                >
                    {isRegistering ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.registerButtonText}>Register as Donor</Text>
                    )}
                </TouchableOpacity>

                {/* Privacy Note */}
                <View style={styles.privacyNote}>
                    <Text style={styles.privacyBadge}>Privacy</Text>
                    <Text style={styles.privacyText}>
                        Your location is only shared when you accept an emergency request.
                    </Text>
                </View>
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
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    iconText: {
        fontSize: 32,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    titleHighlight: {
        color: '#ef4444',
    },
    subtitle: {
        fontSize: 14,
        color: '#71717a',
    },
    card: {
        backgroundColor: 'rgba(24, 24, 27, 0.8)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#27272a',
    },
    field: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#d4d4d8',
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'rgba(39, 39, 42, 0.5)',
        borderWidth: 1,
        borderColor: '#3f3f46',
        borderRadius: 12,
        padding: 14,
        color: '#fff',
        fontSize: 16,
    },
    hint: {
        fontSize: 11,
        color: '#71717a',
        marginTop: 4,
    },
    bloodTypeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    bloodTypeButton: {
        width: '22%',
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#27272a',
        alignItems: 'center',
    },
    bloodTypeButtonActive: {
        backgroundColor: '#dc2626',
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    bloodTypeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#a1a1aa',
    },
    bloodTypeTextActive: {
        color: '#fff',
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    locationButton: {
        backgroundColor: 'rgba(39, 39, 42, 0.5)',
        borderWidth: 1,
        borderColor: '#3f3f46',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
    },
    locationButtonText: {
        color: '#ef4444',
        fontSize: 15,
        fontWeight: '600',
    },
    locationInfo: {
        fontSize: 12,
        color: '#a1a1aa',
        fontFamily: 'monospace',
        marginTop: 6,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 13,
        color: '#ef4444',
        marginTop: 4,
    },
    registerButton: {
        backgroundColor: '#dc2626',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 16,
    },
    registerButtonDisabled: {
        opacity: 0.5,
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },
    privacyNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        backgroundColor: 'rgba(39, 39, 42, 0.5)',
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(63, 63, 70, 0.5)',
    },
    privacyBadge: {
        fontSize: 11,
        fontWeight: '600',
        color: '#4ade80',
        backgroundColor: 'rgba(74, 222, 128, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        overflow: 'hidden',
    },
    privacyText: {
        flex: 1,
        fontSize: 12,
        color: '#a1a1aa',
        lineHeight: 18,
    },
});
