/**
 * Firebase Configuration
 * Realtime Database for cross-device communication
 */

import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyAmauBAz740YqDE05VnR4R6Pdo51aFVi3E",
    authDomain: "life-stream-2dbe6.firebaseapp.com",
    databaseURL: "https://life-stream-2dbe6-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "life-stream-2dbe6",
    storageBucket: "life-stream-2dbe6.firebasestorage.app",
    messagingSenderId: "952066398036",
    appId: "1:952066398036:web:8751a730d5fb32b1f05ac1",
    measurementId: "G-864KKW28W2"
};

// Initialize Firebase (avoid re-initializing in hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Get Realtime Database instance
export const database = getDatabase(app);

export default app;
