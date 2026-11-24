import { useEffect, useState } from 'react';

function getMatch(query: string): boolean {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : false;
}

export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(() => getMatch(query));

    useEffect(() => {
        if (typeof window.matchMedia !== 'function') {
            return;
        }
        const list = window.matchMedia(query);
        const update = () => setMatches(list.matches);
        update();
        list.addEventListener('change', update);
        return () => list.removeEventListener('change', update);
    }, [query]);

    return matches;
}

export const phoneMediaQuery = '(max-width: 639px)';
export const desktopMediaQuery = '(min-width: 1024px)';
