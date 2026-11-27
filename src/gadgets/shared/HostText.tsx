import type { ReactNode } from 'react';

interface HostTextProps {
    app: ReactNode;
    widget: ReactNode;
}

export default function HostText({ app, widget }: HostTextProps) {
    return (
        <>
            <span className="widget:hidden">{app}</span>
            <span className="hidden widget:inline">{widget}</span>
        </>
    );
}
