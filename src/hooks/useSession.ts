import { useCallback } from 'react';

import { useService } from '@/services/injector';

import { useSessionStore } from '@stores';

export function useSession() {
    const {
        userId,
        rootUrl,
        apiRootUrl,
        currentJiraUrl,
        userSettings,
        pageSettings,
        dashboards,
        isAtlasCloud,
        setUserId,
        setRootUrl,
        setApiRootUrl,
        setCurrentJiraUrl,
        setUserSettings,
        setPageSettings,
        updatePageSetting,
        setDashboards,
        setIsAtlasCloud,
        clearSession,
    } = useSessionStore();

    const { $session } = useService('SessionService');

    const syncFromService = useCallback(() => {
        if ($session.userId) {
            setUserId($session.userId);
        }
        if ($session.rootUrl) {
            setRootUrl($session.rootUrl);
        }
        if ($session.apiRootUrl) {
            setApiRootUrl($session.apiRootUrl);
        }
        setUserSettings($session.UserSettings);
        setPageSettings($session.pageSettings);
    }, [$session, setUserId, setRootUrl, setApiRootUrl, setUserSettings, setPageSettings]);

    const getCurrentUserId = useCallback(async () => {
        try {
            const id = await $session.getCurrentUserId();
            setUserId(id);
            return id;
        } catch (error) {
            console.error('Failed to get current user ID:', error);
            throw error;
        }
    }, [$session, setUserId]);

    return {
        userId,
        rootUrl,
        apiRootUrl,
        currentJiraUrl,
        userSettings,
        pageSettings,
        dashboards,
        isAtlasCloud,
        setUserId,
        setRootUrl,
        setApiRootUrl,
        setCurrentJiraUrl,
        setUserSettings,
        setPageSettings,
        updatePageSetting,
        setDashboards,
        setIsAtlasCloud,
        clearSession,
        syncFromService,
        getCurrentUserId,
    };
}
