import { create } from 'zustand';

interface NavigationState {
    isNavDrawerOpen: boolean;
    isSidebarCollapsed: boolean;
    currentPath: string;
    integrationId?: number;

    toggleNavDrawer: () => void;
    setNavDrawerOpen: (open: boolean) => void;
    toggleSidebarCollapse: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    setCurrentPath: (path: string) => void;
    setIntegrationId: (id: number | undefined) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
    isNavDrawerOpen: false,
    isSidebarCollapsed: false,
    currentPath: '/',
    integrationId: undefined,

    toggleNavDrawer: () => set((state) => ({ isNavDrawerOpen: !state.isNavDrawerOpen })),
    setNavDrawerOpen: (open) => set({ isNavDrawerOpen: open }),
    toggleSidebarCollapse: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
    setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
    setCurrentPath: (path) => set({ currentPath: path }),
    setIntegrationId: (id) => set({ integrationId: id }),
}));
