import { useEffect } from 'react';

import { usePokerStore } from '@/stores/poker-store';

import { usePokerActions } from './actions';
import CardsCollection from './CardsCollection';
import Header from './Header';
import InfoBox from './InfoBox';
import IssueCollection from './IssueCollection';
import MembersList from './MembersList';

export default function Room() {
    const { roomId } = usePokerStore();
    const { watchRoom } = usePokerActions();

    useEffect(() => {
        if (!roomId) {
            return;
        }

        const unsubscribe = watchRoom(roomId);

        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, [roomId, watchRoom]);

    return (
        <div className="poker-room flex h-screen w-full flex-col overflow-hidden bg-[var(--bg-secondary)]">
            <div className="poker-room__bg pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-32 -left-32 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
                <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-purple-500/8 blur-3xl" />
            </div>

            <Header />

            <main className="relative z-10 flex flex-1 flex-col overflow-y-auto">
                <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-3 py-4 sm:gap-6 sm:px-6 sm:py-6">
                    <InfoBox />
                    <MembersList />
                </div>
                <div className="h-44 shrink-0 sm:h-48 md:h-52" aria-hidden />
            </main>

            <CardsCollection />
            <IssueCollection />
        </div>
    );
}
