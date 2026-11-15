import classNames from 'classnames';

interface UserAvatarProps {
    name: string;
    avatarUrl?: string;
    size?: 'xs' | 'sm' | 'md';
    className?: string;
}

const sizeClassNames = { xs: 'h-4 w-4 text-[8px]', sm: 'h-5 w-5 text-[9px]', md: 'h-7 w-7 text-xs' };

function getInitials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

export default function UserAvatar({ name, avatarUrl, size = 'sm', className }: UserAvatarProps) {
    const classes = classNames('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full', sizeClassNames[size], className);
    if (avatarUrl) {
        return <img src={avatarUrl} alt={name} title={name} className={classes} />;
    }
    return (
        <span className={classNames(classes, 'bg-(--color-primary-100) font-semibold text-(--color-primary-700)')} title={name}>
            {getInitials(name) || '?'}
        </span>
    );
}
