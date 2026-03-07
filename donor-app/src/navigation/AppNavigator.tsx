/**
 * AppNavigator — Navigation Setup
 * 
 * Bottom tab navigation between Profile and Alerts.
 * Registration is shown as a full-screen if donor is not yet registered.
 */

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProfileScreen from '../views/screens/ProfileScreen';
import AlertsScreen from '../views/screens/AlertsScreen';
import RegistrationScreen from '../views/screens/RegistrationScreen';

const DONOR_STORAGE_KEY = '@lifestream_donor';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
    const [isRegistered, setIsRegistered] = useState<boolean | null>(null);

    useEffect(() => {
        const check = async () => {
            const data = await AsyncStorage.getItem(DONOR_STORAGE_KEY);
            setIsRegistered(!!data);
        };
        check();
    }, []);

    // Loading
    if (isRegistered === null) {
        return (
            <View style={styles.loading}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    // Not registered — show registration
    if (!isRegistered) {
        return (
            <RegistrationScreen onRegistered={() => setIsRegistered(true)} />
        );
    }

    // Registered — show tab navigation
    return (
        <NavigationContainer>
            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: '#18181b',
                        borderTopColor: '#27272a',
                        borderTopWidth: 1,
                        height: 60,
                        paddingBottom: 8,
                        paddingTop: 8,
                    },
                    tabBarActiveTintColor: '#ef4444',
                    tabBarInactiveTintColor: '#71717a',
                    tabBarLabelStyle: {
                        fontSize: 12,
                        fontWeight: '600',
                    },
                }}
            >
                <Tab.Screen
                    name="Profile"
                    component={ProfileScreen}
                    options={{
                        tabBarIcon: ({ color, size }) => (
                            <Text style={{ fontSize: size, color }}>👤</Text>
                        ),
                    }}
                />
                <Tab.Screen
                    name="Alerts"
                    component={AlertsScreen}
                    options={{
                        tabBarIcon: ({ color, size }) => (
                            <Text style={{ fontSize: size, color }}>🔔</Text>
                        ),
                    }}
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        backgroundColor: '#0c0a09',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        color: '#71717a',
        fontSize: 16,
    },
});
