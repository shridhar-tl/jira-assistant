import { create } from 'zustand';

import type { SessionUser } from '../types/entities';

interface Dashboard {
    id?: number;
    name: string;
    icon?: string;
    layout: number;
    isQuickView?: boolean;
    widgets: any[];
}

interface SessionState {
    userId?: number;
    rootUrl: string;
    apiRootUrl: string;
    currentJiraUrl?: string;
    userSettings: Record<string, any>;
    pageSettings: Record<string, any>;
    dashboards: Dashboard[];
    isAtlasCloud: boolean;
    currentUser?: SessionUser;

    setUserId: (userId: number) => void;
    setRootUrl: (url: string) => void;
    setApiRootUrl: (url: string) => void;
    setCurrentJiraUrl: (url: string) => void;
    setUserSettings: (settings: Record<string, any>) => void;
    setPageSettings: (settings: Record<string, any>) => void;
    updatePageSetting: (page: string, settings: any) => void;
    setDashboards: (dashboards: Dashboard[]) => void;
    setIsAtlasCloud: (isCloud: boolean) => void;
    setCurrentUser: (user: SessionUser) => void;
    clearSession: () => void;
    getCurrentUserId: () => Promise<number | undefined>;
}

const initialState = {
    userId: undefined,
    rootUrl: '',
    apiRootUrl: '',
    currentJiraUrl: undefined,
    userSettings: {},
    pageSettings: {},
    dashboards: [],
    isAtlasCloud: false,
    currentUser: undefined,
};

export const useSessionStore = create<SessionState>((set, get) => ({
    ...initialState,

    setUserId: (userId) => set({ userId }),
    setRootUrl: (url) => set({ rootUrl: url }),
    setApiRootUrl: (url) => set({ apiRootUrl: url }),
    setCurrentJiraUrl: (url) => set({ currentJiraUrl: url }),
    setUserSettings: (settings) => set({ userSettings: settings }),
    setPageSettings: (settings) => set({ pageSettings: settings }),
    updatePageSetting: (page, settings) =>
        set((state) => ({
            pageSettings: {
                ...state.pageSettings,
                [page]: settings,
            },
        })),
    setDashboards: (dashboards) => set({ dashboards }),
    setIsAtlasCloud: (isCloud) => set({ isAtlasCloud: isCloud }),
    setCurrentUser: (user) => set({ currentUser: user }),
    clearSession: () => set(initialState),
    getCurrentUserId: async () => get().userId,
}));
