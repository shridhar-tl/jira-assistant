import { toSafeUrl } from '@utils/safe-url';

export interface SprintCloser {
    name: string;
    url?: string;
}

export function parseSprintCloser(html: string, mapJiraUrl: (url: string) => string): SprintCloser {
    const source = new DOMParser().parseFromString(html, 'text/html').body;
    const firstNode = source.childNodes[0];

    if (firstNode instanceof HTMLAnchorElement) {
        const href = firstNode.getAttribute('href');
        return { name: firstNode.textContent || '', url: href ? toSafeUrl(mapJiraUrl(href)) : undefined };
    }

    return { name: source.textContent || '' };
}
