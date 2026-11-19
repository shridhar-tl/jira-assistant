export function isClosed(state?: string): boolean {
    return state?.toLowerCase() === 'closed';
}

export function isIconUrl(url?: string): boolean {
    if (!url) return false;
    try {
        return new URL(url).pathname.length > 1;
    } catch {
        return false;
    }
}
