import { type ElementType } from 'react';

import { Image } from '@/controls';
import type { JiraUser } from '@/types';

import BaseControl from './BaseControl';

interface UserDisplayProps {
    value?: JiraUser | string;
    user?: JiraUser | string;
    settings?: {
        showImage?: boolean;
        valueType?: 'name' | 'email' | 'both';
        [key: string]: any;
    };
    imgClassName?: string;
    tag?: ElementType | null;
    className?: string;
    [key: string]: any;
}

function UserDisplay({ value, user = value, settings, imgClassName = 'w-8 h-8', tag, className, ...rest }: UserDisplayProps) {
    if (!user) return <BaseControl tag={tag} className={className} {...rest} />;

    if (typeof user === 'string') {
        return (
            <BaseControl tag={tag} className={className} {...rest}>
                {user}
            </BaseControl>
        );
    }

    const imageUrl = !!settings?.showImage && (user.avatarUrls?.['32x32'] || user.avatarUrls?.['48x48']);
    const valueType = settings?.valueType;

    let disp: React.ReactNode = user.displayName;

    if (valueType === 'email') {
        disp = user.emailAddress;
    } else if (valueType === 'both') {
        disp = user.emailAddress ? (
            <>
                {user.displayName} ({user.emailAddress})
            </>
        ) : (
            user.displayName
        );
    }

    return (
        <BaseControl tag={tag} className={className} {...rest}>
            {!!imageUrl && <Image className={`${imgClassName} rounded-full mr-2`} src={imageUrl} />}
            {disp}
        </BaseControl>
    );
}

export default UserDisplay;
