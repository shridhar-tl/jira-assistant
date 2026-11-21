export interface SprintCloser {
    name: string;
    url?: string;
}

const allowedLinkProtocols = new Set(['http:', 'https:']);

function toSafeUrl(href: string, mapJiraUrl: (url: string) => string): string | undefined {
    try {
        const url = new URL(mapJiraUrl(href));
        return allowedLinkProtocols.has(url.protocol) ? url.href : undefined;
    } catch {
        return undefined;
    }
}

export function parseSprintCloser(html: string, mapJiraUrl: (url: string) => string): SprintCloser {
    const source = new DOMParser().parseFromString(html, 'text/html').body;
    const firstNode = source.childNodes[0];

    if (firstNode instanceof HTMLAnchorElement) {
        const href = firstNode.getAttribute('href');
        return { name: firstNode.textContent || '', url: href ? toSafeUrl(href, mapJiraUrl) : undefined };
    }

    return { name: source.textContent || '' };
}
