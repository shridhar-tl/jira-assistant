import { useEffect, useRef, useState } from 'react';

import { Dialog } from '@/dialogs';
import { usePokerStore } from '@/stores/poker-store';

import { showSnackbar } from '@components';

import { usePokerActions } from './actions';
import { Avatar, UserAvatar } from './Avatar';
import { avatars } from './constants';

export default function Header() {
    const { roomName, roomId, sid, moderatorId, members } = usePokerStore();
    const { showSettings, copyUrl, exitRoom } = usePokerActions();
    const isModerator = sid === moderatorId;
    const me = members.find((m) => m.id === sid);

    const handleCopyRoomCode = () => {
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(roomId);
            showSnackbar('Room code copied', '', { type: 'success', timeout: 1500 });
        }
    };

    const handleCopyInvite = () => {
        copyUrl();
        showSnackbar('Invite link copied', '', { type: 'success', timeout: 1500 });
    };

    const handleExit = () => {
        const message = isModerator ? 'Close this room and clear all data for everyone?' : 'Leave this room? Your votes will be discarded.';
        Dialog.yesNo(message, isModerator ? 'Close room' : 'Leave room').then(exitRoom);
    };

    return (
        <header className="relative z-30 shrink-0 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/95 backdrop-blur-md shadow-sm">
            <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3">
                <button
                    onClick={showSettings}
                    title={isModerator ? 'Issues & Settings' : 'View issues'}
                    className="group flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-secondary)] hover:text-[var(--primary-color)] active:scale-95"
                >
                    <span className="fa fa-list-ul text-base transition-transform group-hover:scale-110" />
                </button>

                <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-lg shadow-lg shadow-purple-500/25 sm:h-11 sm:w-11">
                        <span aria-hidden>🃏</span>
                    </div>
                    <div className="flex min-w-0 flex-col">
                        <h1 className="truncate text-sm font-bold leading-tight text-[var(--text-primary)] sm:text-base">
                            {roomName || 'Planning Poker'}
                        </h1>
                        <button
                            onClick={handleCopyRoomCode}
                            title="Copy room code"
                            className="group inline-flex max-w-fit cursor-pointer items-center gap-1 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--primary-color)] sm:text-xs"
                        >
                            <span className="font-mono opacity-80">#{roomId}</span>
                            <span className="fa fa-copy text-[10px] opacity-50 group-hover:opacity-100" />
                        </button>
                    </div>
                </div>

                <button
                    onClick={handleCopyInvite}
                    title="Copy invite link"
                    className="hidden h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-secondary)] hover:text-[var(--primary-color)] active:scale-95 md:flex"
                >
                    <span className="fa fa-link text-base" />
                </button>

                <UserMenu meName={me?.name} isModerator={isModerator} onCopyInvite={handleCopyInvite} onExit={handleExit} />
            </div>
        </header>
    );
}

interface UserMenuProps {
    meName?: string;
    isModerator: boolean;
    onCopyInvite: () => void;
    onExit: () => void;
}

function UserMenu({ meName, isModerator, onCopyInvite, onExit }: UserMenuProps) {
    const [open, setOpen] = useState(false);
    const { setAvatar } = usePokerActions();
    const wrapRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open) {
            return;
        }
        const handler = (e: MouseEvent) => {
            if (!wrapRef.current?.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        const escHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        document.addEventListener('keydown', escHandler);
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('keydown', escHandler);
        };
    }, [open]);

    const handleAvatarSelect = (avatarId: number | null) => {
        setAvatar(avatarId);
    };

    return (
        <div ref={wrapRef} className="relative">
            <button
                onClick={() => setOpen((o) => !o)}
                title="Your profile"
                className="group flex cursor-pointer items-center gap-2 rounded-full p-0.5 pr-1 transition-all hover:bg-[var(--bg-secondary)] sm:pr-3"
            >
                <div className="relative h-10 w-10 shrink-0 sm:h-11 sm:w-11">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 opacity-80 blur-[2px] transition-opacity group-hover:opacity-100" />
                    <div className="relative h-full w-full overflow-hidden rounded-full ring-2 ring-[var(--bg-primary)]">
                        <UserAvatar />
                    </div>
                    {isModerator && (
                        <span
                            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] shadow"
                            title="Moderator"
                        >
                            👑
                        </span>
                    )}
                </div>
                <span className="hidden max-w-[140px] truncate text-sm font-semibold text-[var(--text-primary)] sm:block">
                    {meName || 'You'}
                </span>
                <span className="fa fa-chevron-down hidden text-[10px] text-[var(--text-secondary)] sm:inline" />
            </button>

            {open && (
                <div className="absolute top-full right-0 z-40 mt-2 w-72 origin-top-right overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-2xl">
                    <div className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/60 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                            {isModerator ? 'Moderator' : 'Player'}
                        </p>
                        <p className="truncate text-sm font-bold text-[var(--text-primary)]">{meName || 'You'}</p>
                    </div>

                    <div className="px-4 py-3">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                            Choose your avatar
                        </p>
                        <div className="grid grid-cols-6 gap-1">
                            <button
                                onClick={() => handleAvatarSelect(null)}
                                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-2xl transition-all hover:scale-110 hover:bg-[var(--bg-secondary)]"
                                title="Default"
                            >
                                <Avatar avatarId={null} />
                            </button>
                            {avatars.map((emoji, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleAvatarSelect(i)}
                                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-2xl transition-all hover:scale-110 hover:bg-[var(--bg-secondary)]"
                                    title={emoji}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col border-t border-[var(--border-color)]">
                        <button
                            onClick={() => {
                                setOpen(false);
                                onCopyInvite();
                            }}
                            className="group flex cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)]"
                        >
                            <span className="fa fa-link text-[var(--primary-color)]" />
                            <span className="font-medium">Copy invite link</span>
                        </button>
                        <button
                            onClick={() => {
                                setOpen(false);
                                onExit();
                            }}
                            className="group flex cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--danger-color,#ef4444)] transition-colors hover:bg-red-500/10"
                        >
                            <span className="fa fa-sign-out" />
                            <span className="font-medium">{isModerator ? 'Close room' : 'Leave room'}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
