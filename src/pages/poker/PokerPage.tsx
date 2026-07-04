import { useEffect } from 'react';

import { Routes, Route, useParams } from 'react-router-dom';

import { usePokerStore } from '@/stores/poker-store';

import JoinPoker from './JoinPoker';
import Room from './Room';

function SwitchPage() {
    const { roomId: paramRoomId } = useParams();
    const { roomId } = usePokerStore();

    const Component = paramRoomId && roomId ? Room : JoinPoker;
    return <Component />;
}

interface PokerPageProps {
    hasExtensionSupport?: boolean;
}

export default function PokerPage({ hasExtensionSupport = false }: PokerPageProps) {
    const { setState } = usePokerStore();

    useEffect(() => {
        setState({ hasExtensionSupport });
    }, [hasExtensionSupport, setState]);

    return (
        <div className="min-h-screen">
            <Routes>
                <Route path=":roomId" element={<SwitchPage />} />
                <Route path="/" element={<JoinPoker />} />
            </Routes>
        </div>
    );
}
