export interface ExtensionState {
    extnUnavailable: boolean;
    isExtnValid: boolean;
    needIntegration: boolean;
    loading: boolean;
}

export interface AuthenticatePageProps {
    isExtnValid?: boolean;
    extnUnavailable?: boolean;
    needIntegration?: boolean;
    onAuthTypeChosen?: (authType: string) => void;
}
