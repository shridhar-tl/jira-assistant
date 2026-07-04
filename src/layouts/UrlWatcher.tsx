import { memo, useEffect, useRef } from 'react';

import { useLocation } from 'react-router-dom';

interface UrlWatcherProps {
    onChange: (pathname: string) => void;
}

const UrlWatcher = memo(function UrlWatcher({ onChange }: UrlWatcherProps) {
    const location = useLocation();
    const prevPathname = useRef(location.pathname);

    useEffect(() => {
        if (prevPathname.current !== location.pathname) {
            prevPathname.current = location.pathname;
            onChange(location.pathname);
        }
    }, [location.pathname]);

    return null;
});

export default UrlWatcher;
