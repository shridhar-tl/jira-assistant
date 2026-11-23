export const webLinkProtocols: ReadonlySet<string> = new Set(['http:', 'https:']);

export function toSafeUrl(href: string, allowedProtocols: ReadonlySet<string> = webLinkProtocols): string | undefined {
    try {
        const url = new URL(href);
        return allowedProtocols.has(url.protocol) ? url.href : undefined;
    } catch {
        return undefined;
    }
}
