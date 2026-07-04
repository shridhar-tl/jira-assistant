import type { ReactNode } from 'react';

import { Link as RouterLink } from 'react-router-dom';

interface LinkProps {
    href: string;
    newTab?: boolean;
    children: ReactNode;
    className?: string;
    [key: string]: any;
}

function stopPropagation(e: React.MouseEvent) {
    e.stopPropagation();
}

function Link({ href, newTab = true, children, ...others }: LinkProps) {
    if (newTab !== false) {
        others.target = '_blank';
        others.rel = 'noreferrer';

        return (
            <a href={href} {...others} onClick={stopPropagation}>
                {children}
            </a>
        );
    } else {
        return (
            <RouterLink to={href} {...others}>
                {children}
            </RouterLink>
        );
    }
}

export default Link;
