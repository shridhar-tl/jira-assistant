import { create } from 'zustand';

import type { SessionUser } from '@types';

interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    needsIntegration: boolean;
    currentUser: Partial<SessionUser> | null;
    error: string | null;

    setAuthenticated: (authenticated: boolean) => void;
    setLoading: (loading: boolean) => void;
    setNeedsIntegration: (needs: boolean) => void;
    setCurrentUser: (user: Partial<SessionUser> | null) => void;
    setError: (error: string | null) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: false,
    isLoading: true,
    needsIntegration: false,
    currentUser: null,
    error: null,

    setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
    setLoading: (loading) => set({ isLoading: loading }),
    setNeedsIntegration: (needs) => set({ needsIntegration: needs }),
    setCurrentUser: (user) => set({ currentUser: user }),
    setError: (error) => set({ error }),

    clearAuth: () =>
        set({
            isAuthenticated: false,
            isLoading: false,
            needsIntegration: false,
            currentUser: null,
            error: null,
        }),
}));
