export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T = any> {
    items: T[];
    total: number;
    startAt: number;
    maxResults: number;
}

export interface JiraSearchResult<T = any> {
    expand: string;
    startAt: number;
    maxResults: number;
    total: number;
    issues: T[];
}

export interface MenuItem {
    id: string;
    label: string;
    icon?: string;
    path?: string;
    action?: () => void;
    children?: MenuItem[];
    visible?: boolean;
    disabled?: boolean;
}

export interface RouteConfig {
    path: string;
    component: React.ComponentType<any>;
    exact?: boolean;
    title?: string;
    requiresAuth?: boolean;
}

export interface ThemeConfig {
    mode: 'light' | 'dark';
    primaryColor?: string;
}

export interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
    timeout?: number;
}

export interface ValidationError {
    field: string;
    message: string;
}

export interface FormErrors {
    [field: string]: string;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T = any> {
    field: keyof T;
    direction: SortDirection;
}

export interface FilterConfig {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
    value: any;
}

export interface DateRange {
    from: Date;
    to: Date;
}

export interface TimeRange {
    start: string;
    end: string;
}

export interface LoadingState {
    isLoading: boolean;
    error?: string;
}

export type AsyncResult<T> = {
    data?: T;
    error?: Error;
    isLoading: boolean;
};

export interface ConfirmDialogOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
}

export interface ToastOptions {
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type ValueOf<T> = T[keyof T];

export type KeysOfType<T, V> = {
    [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];
