'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User as FirebaseUser,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { User } from '@/types';

interface AuthContextType {
    user: FirebaseUser | null;
    userData: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, username: string) => Promise<FirebaseUser>;
    signOut: () => Promise<void>;
    refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [userData, setUserData] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch user data from Firestore
    const fetchUserData = async (uid: string) => {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                setUserData({ uid, ...userDoc.data() } as User);
            } else {
                setUserData(null);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            setUserData(null);
        }
    };

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                await fetchUserData(firebaseUser.uid);
            } else {
                setUserData(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Sign in with email and password
    const signIn = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    // Sign up with email and password
    const signUp = async (email: string, password: string, username: string) => {
        const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);

        // Update display name
        await updateProfile(newUser, { displayName: username });

        // Create initial user document
        await setDoc(doc(db, 'users', newUser.uid), {
            email,
            username,
            displayName: username,
            isPremium: false,
            isVerified: false,
            isActive: true,
            dailySwipes: 0,
            lastSwipeReset: Timestamp.now(),
            tokens: 0,
            maxTokens: 20,
            reviewStatus: 'pending',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            lastOnline: Timestamp.now(),
            photos: [],
            interests: [],
        });

        return newUser;
    };

    // Sign out
    const signOut = async () => {
        await firebaseSignOut(auth);
        setUser(null);
        setUserData(null);
    };

    // Refresh user data
    const refreshUserData = async () => {
        if (user) {
            await fetchUserData(user.uid);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                userData,
                loading,
                signIn,
                signUp,
                signOut,
                refreshUserData,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
