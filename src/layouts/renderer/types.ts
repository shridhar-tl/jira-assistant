export interface AuthInfo {
    authenticated: boolean;
    jiraUrl?: string;
    userId?: number | null;
    needIntegration?: boolean;
}

export interface InitValue {
    authType?: string;
    extnUnavailable?: boolean;
    isExtnValid?: boolean;
    extnVersion?: number;
    needIntegration?: boolean;
    authReady?: boolean;
    extnAccessDeniedReason?: string;
}

export interface AppContextValue {
    switchUser: (userId: number) => void;
    navigate: (url: string, userbased?: boolean) => void;
}

export interface RendererProps {
    initValue?: InitValue;
    authInfo?: AuthInfo | false;
    authTypeChosen?: (authType: string) => void;
    contextProps?: AppContextValue;
}
