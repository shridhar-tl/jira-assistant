import { useMemo } from 'react';

import { useParams } from 'react-router-dom';

import { PokerAppUrl } from '@constants/urls';

import PokerBridge from './PokerBridge';

const iframeAllow = 'clipboard-write; clipboard-read';

interface PokerPageProps {
    hasExtensionSupport?: boolean;
}

export default function PokerPage({ hasExtensionSupport = false }: PokerPageProps) {
    const { roomId } = useParams();

    const src = useMemo(() => {
        const base = `${PokerAppUrl}${roomId ? `/room/${roomId}` : ''}`;
        return `${base}?host=ja&jira=${hasExtensionSupport ? '1' : '0'}`;
    }, [roomId, hasExtensionSupport]);

    return (
        <div className="poker-host flex h-full min-h-screen w-full flex-col">
            {hasExtensionSupport && <PokerBridge />}
            <iframe
                src={src}
                title="Planning Poker"
                allow={iframeAllow}
                className="h-full min-h-screen w-full flex-1 border-0"
            />
        </div>
    );
}
