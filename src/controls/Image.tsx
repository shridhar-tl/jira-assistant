import { useState, type ReactNode } from 'react';

import classNames from 'classnames';

interface ImageProps {
    src: string;
    alt?: string;
    className?: string;
    title?: string;
    fallback?: ReactNode;
}

function getPathName(src: string): string {
    try {
        return new URL(src).pathname;
    } catch {
        return '';
    }
}

function Image({ src, fallback, alt = '', className, title }: ImageProps) {
    const [fb, setFallback] = useState<{ src?: string; fallback?: boolean }>({});

    if (!src || getPathName(src).length < 3) {
        return <>{fallback || null}</>;
    }

    const useFallbackEl = () => setFallback({ src, fallback: true });

    if (fallback && fb.fallback && fb.src === src) {
        return <>{fallback}</>;
    }

    return <img src={src} alt={alt} title={title} onError={useFallbackEl} className={classNames('inline-block w-4 h-4 align-middle', className)} />;
}

export default Image;
