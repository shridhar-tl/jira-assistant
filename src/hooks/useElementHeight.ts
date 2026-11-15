import { useEffect, useState } from 'react';

export function useElementHeight(element: HTMLElement | null): number {
    const [height, setHeight] = useState(0);

    useEffect(() => {
        if (!element || typeof ResizeObserver === 'undefined') {
            return;
        }
        const update = () => setHeight(element.clientHeight);
        update();
        const observer = new ResizeObserver(update);
        observer.observe(element);
        return () => observer.disconnect();
    }, [element]);

    return height;
}
