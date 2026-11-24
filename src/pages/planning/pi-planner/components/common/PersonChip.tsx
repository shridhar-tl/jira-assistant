import { Avatar } from '@components';

import { toSafeUrl } from '@utils/safe-url';


import type { PiUserRef } from '../../pi-types';

interface PersonChipProps {
    user: PiUserRef | null;
    prefix?: string;
    size?: 'xs' | 'sm';
}

export default function PersonChip({ user, prefix, size = 'xs' }: PersonChipProps) {
    if (!user) {
        return null;
    }
    return (
        <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-(--text-secondary)" title={`${prefix ? `${prefix} ` : ''}${user.displayName}`}>
            <Avatar src={user.avatarUrl ? toSafeUrl(user.avatarUrl) : undefined} name={user.displayName} size={size} />
            <span className="truncate">
                {prefix && `${prefix} `}
                <span className="font-medium text-(--text-primary)">{user.displayName}</span>
            </span>
        </span>
    );
}
