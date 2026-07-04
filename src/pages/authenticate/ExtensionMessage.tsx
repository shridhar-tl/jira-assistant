import type { ExtensionState } from './types';

const messages: Record<string, string> = {
    unavailable:
        'Please install Jira Assistant extension and ensure it is enabled. If you believe the latest version is already installed and enabled, then please ensure the service worker is running in the extension.',
    outdated:
        'You are using an old version of Jira Assistant extension. Some features are not supported until you update your extension to the latest version. Please update and refresh this page.',
    needIntegration:
        'Required version of extension is already installed but you haven\'t yet integrated with Jira. Select this option to connect and integrate extension with Jira, or click the JA icon in your browser to integrate first.',
    ready: 'Required version of extension is already installed and ready to use. Select this option to connect with Jira Assistant extension and use the latest features and bug fixes.',
};

function getMessageKey(extnUnavailable: boolean, isExtnValid: boolean, needIntegration: boolean): string {
    if (extnUnavailable) return 'unavailable';
    if (!isExtnValid) return 'outdated';
    if (needIntegration) return 'needIntegration';
    return 'ready';
}

function ExtensionMessage({ extnUnavailable, isExtnValid, needIntegration }: Omit<ExtensionState, 'loading'>) {
    const key = getMessageKey(extnUnavailable, isExtnValid, needIntegration);

    return <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{messages[key]}</p>;
}

export default ExtensionMessage;
