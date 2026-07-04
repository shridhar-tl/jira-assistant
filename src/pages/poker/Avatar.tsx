import { useState } from 'react';

import { usePokerStore } from '@/stores/poker-store';

import { avatars, fallbackAvatar } from './constants';

interface AvatarProps {
    avatarUrl?: string;
    name?: string;
    avatarId?: number | null;
    onClick?: (avatarId?: number | null) => void;
    className?: string;
}

export function Avatar({ avatarUrl, name, avatarId, onClick, className = '' }: AvatarProps) {
    const useEmoji = avatarId !== undefined && avatarId !== null && avatarId >= 0;
    const icon = useEmoji ? avatars[avatarId] : fallbackAvatar;

    const [fallback, setFallback] = useState<{ avatarUrl?: string; fallback?: boolean }>({});

    const handleClick = () => {
        if (onClick) {
            onClick(avatarId);
        }
    };

    const handleImageError = () => {
        setFallback({ avatarUrl, fallback: true });
    };

    if (!avatarUrl || getPathName(avatarUrl).length < 3 || useEmoji || (fallback.fallback && fallback.avatarUrl === avatarUrl)) {
        return (
            <div
                className={`w-full h-full rounded-full bg-(--primary-color) text-white flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity select-none leading-none ${className || 'text-xl'}`}
                onClick={handleClick}
            >
                {icon}
            </div>
        );
    }

    return (
        <img
            src={avatarUrl}
            alt={name || 'Avatar'}
            className={`w-full h-full rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity ${className}`}
            onError={handleImageError}
            onClick={handleClick}
        />
    );
}

export function UserAvatar({ onClick }: { onClick?: () => void }) {
    const { sid, members } = usePokerStore();
    const member = members.find((m) => m.id === sid);

    if (!member) {
        return null;
    }

    return <Avatar {...member} onClick={onClick} />;
}

function getPathName(src: string) {
    try {
        return new URL(src).pathname;
    } catch (err) {
        console.warn('Invalid URL Passed: ', src, err);
    }
    return '';
}
