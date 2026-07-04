import React from 'react';

import { Link as RouterLink } from 'react-router-dom';

import { router } from '@forge/bridge';

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    newTab?: boolean;
    children?: React.ReactNode;
}

const Link: React.FC<LinkProps> = ({ href, newTab, children, ...others }) => {
    if (newTab !== false) {
        const props = { ...others, target: '_blank', rel: 'noreferrer', href };
        return (
            <a {...props} onClick={stopPropagation}>
                {children}
            </a>
        );
    } else {
        return (
            <RouterLink to={href} {...(others as any)}>
                {children}
            </RouterLink>
        );
    }
};

export default Link;

function stopPropagation(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    e.stopPropagation();

    const href = e.currentTarget.href;
    if (href) {
        router.open(href).catch(console.error);
    }
}
