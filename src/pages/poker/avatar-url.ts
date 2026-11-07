const jiraAvatarHostSuffixes = ['.atlassian.net', '.atl-paas.net'];
const gravatarHostSuffix = 'gravatar.com';
const gravatarFallbackParam = 'd';

function parseHttpsUrl(url: string): URL | null {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' ? parsed : null;
    } catch {
        return null;
    }
}

function hostOf(url: string | undefined): string | null {
    try {
        return url ? new URL(url).hostname : null;
    } catch {
        return null;
    }
}

function isJiraAvatarHost(hostname: string, siteHost: string | null): boolean {
    return hostname === siteHost || jiraAvatarHostSuffixes.some((suffix) => hostname.endsWith(suffix));
}

export function jiraAvatarUrl(url: string | undefined, siteRoot?: string): string | undefined {
    const parsed = url ? parseHttpsUrl(url) : null;
    if (parsed === null) {
        return undefined;
    }
    const siteHost = hostOf(siteRoot);
    if (isJiraAvatarHost(parsed.hostname, siteHost)) {
        return parsed.href;
    }
    if (parsed.hostname === gravatarHostSuffix || parsed.hostname.endsWith(`.${gravatarHostSuffix}`)) {
        const fallback = parsed.searchParams.get(gravatarFallbackParam);
        const fallbackUrl = fallback ? parseHttpsUrl(fallback) : null;
        return fallbackUrl !== null && isJiraAvatarHost(fallbackUrl.hostname, siteHost) ? fallbackUrl.href : undefined;
    }
    return undefined;
}
