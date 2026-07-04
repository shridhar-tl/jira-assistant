import { create } from 'zustand';

interface NavigationState {
    isSidebarOpen: boolean;
    isSidebarCollapsed: boolean;
    currentPath: string;
    integrationId?: number;

    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    toggleSidebarCollapse: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    setCurrentPath: (path: string) => void;
    setIntegrationId: (id: number | undefined) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
    isSidebarOpen: true,
    isSidebarCollapsed: false,
    currentPath: '/',
    integrationId: undefined,

    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    setSidebarOpen: (open) => set({ isSidebarOpen: open }),
    toggleSidebarCollapse: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
    setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
    setCurrentPath: (path) => set({ currentPath: path }),
    setIntegrationId: (id) => set({ integrationId: id }),
}));
