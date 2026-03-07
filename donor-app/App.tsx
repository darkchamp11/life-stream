/**
 * LifeStream — Donor Mobile App
 * 
 * Entry point for the React Native + Expo donor application.
 * MVVM Architecture:
 * - Models: src/models/
 * - Services: src/services/
 * - ViewModels: src/viewmodels/
 * - Views: src/views/
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
    return (
        <>
            <StatusBar style="light" />
            <AppNavigator />
        </>
    );
}
