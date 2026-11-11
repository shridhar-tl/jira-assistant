const jaRootDomain = 'jiraassistant.com';
const jaWebAppOrigin = 'https://app.jiraassistant.com';
const jaLocalWebAppOrigin = 'https://local.jiraassistant.com';

function parseOrigin(origin: string | null | undefined): URL | null {
    if (!origin) {
        return null;
    }
    try {
        return new URL(origin);
    } catch {
        return null;
    }
}

export function isHttpsOriginOfDomain(origin: string | null | undefined, rootDomain: string): boolean {
    const parsed = parseOrigin(origin);
    if (parsed?.protocol !== 'https:') {
        return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    return hostname === rootDomain || hostname.endsWith(`.${rootDomain}`);
}

export function isTrustedJAOrigin(origin: string | null | undefined): boolean {
    return isHttpsOriginOfDomain(origin, jaRootDomain);
}

export function isJAWebAppOrigin(origin: string | null | undefined, allowLocalOrigin: boolean): boolean {
    const parsed = parseOrigin(origin);
    if (parsed?.protocol !== 'https:') {
        return false;
    }
    const normalizedOrigin = parsed.origin.toLowerCase();
    return normalizedOrigin === jaWebAppOrigin || (allowLocalOrigin && normalizedOrigin === jaLocalWebAppOrigin);
}

export function getSenderOrigin(sender: { origin?: string; url?: string }): string | null {
    if (sender.origin) {
        return sender.origin;
    }
    if (!sender.url) {
        return null;
    }
    try {
        return new URL(sender.url).origin;
    } catch {
        return null;
    }
}
