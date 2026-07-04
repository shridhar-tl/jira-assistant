import { useCallback } from 'react';

import { useService } from '@/services/injector';

import { useAuthStore } from '@stores';

export function useAuth() {
    const {
        isAuthenticated,
        isLoading,
        needsIntegration,
        currentUser,
        error,
        setAuthenticated,
        setLoading,
        setNeedsIntegration,
        setCurrentUser,
        setError,
        clearAuth,
    } = useAuthStore();

    const { $auth, $session } = useService('AuthService', 'SessionService');

    const authenticate = useCallback(
        async (userId?: number, useProfile = true) => {
            setLoading(true);
            setError(null);

            try {
                const success = await $auth.authenticate(userId, useProfile);

                if (success) {
                    setAuthenticated(true);
                    setNeedsIntegration(false);
                    setCurrentUser($session.CurrentUser);
                } else {
                    setAuthenticated(false);
                    setNeedsIntegration($session.needIntegration);
                }

                return success;
            } catch (err: any) {
                setError(err?.message || 'Authentication failed');
                setAuthenticated(false);
                return false;
            } finally {
                setLoading(false);
            }
        },
        [$auth, $session, setAuthenticated, setLoading, setNeedsIntegration, setCurrentUser, setError],
    );

    const logout = useCallback(() => {
        $session.clearSession();
        clearAuth();
    }, [$session, clearAuth]);

    const checkAuth = useCallback(async () => {
        setLoading(true);

        try {
            const userId = await $session.getCurrentUserId();

            if (userId) {
                await authenticate(userId);
            } else {
                setNeedsIntegration(true);
            }
        } catch {
            setNeedsIntegration(true);
        } finally {
            setLoading(false);
        }
    }, [$session, authenticate, setLoading, setNeedsIntegration]);

    return {
        isAuthenticated,
        isLoading,
        needsIntegration,
        currentUser,
        error,
        authenticate,
        logout,
        checkAuth,
    };
}
