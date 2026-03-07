/**
 * useAuth ViewModel
 * 
 * Manages Firebase Authentication state for the hospital dashboard:
 * - signIn(email, password) — Firebase signInWithEmailAndPassword
 * - signOut() — Firebase signOut
 * - user — current Firebase user
 * - loading — auth state loading
 * - error — last auth error message
 * - getIdToken() — get fresh ID token for API calls
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    type User,
} from 'firebase/auth';
import { auth } from '@/services/firebase';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    // Sign in with email and password
    const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return true;
        } catch (err: unknown) {
            const firebaseError = err as { code?: string; message?: string };
            switch (firebaseError.code) {
                case 'auth/user-not-found':
                    setError('No hospital account found with this email.');
                    break;
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    setError('Invalid password. Please try again.');
                    break;
                case 'auth/too-many-requests':
                    setError('Too many login attempts. Please try again later.');
                    break;
                case 'auth/user-disabled':
                    setError('This hospital account has been suspended.');
                    break;
                default:
                    setError(firebaseError.message || 'Login failed. Please try again.');
            }
            return false;
        }
    }, []);

    // Sign out
    const signOut = useCallback(async () => {
        setError(null);
        await firebaseSignOut(auth);
    }, []);

    // Get fresh ID token for API calls
    const getIdToken = useCallback(async (): Promise<string | null> => {
        if (!user) return null;
        try {
            return await user.getIdToken(true);
        } catch {
            return null;
        }
    }, [user]);

    return {
        user,
        loading,
        error,
        signIn,
        signOut,
        getIdToken,
        isAuthenticated: !!user,
    };
}
