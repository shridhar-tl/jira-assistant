export interface ExtensionState {
    extnUnavailable: boolean;
    isExtnValid: boolean;
    needIntegration: boolean;
    extnAccessDeniedReason?: string;
    loading: boolean;
}

export interface AuthenticatePageProps {
    isExtnValid?: boolean;
    extnUnavailable?: boolean;
    needIntegration?: boolean;
    extnAccessDeniedReason?: string;
    onAuthTypeChosen?: (authType: string) => void;
}
