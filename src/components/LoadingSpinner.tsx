import React from 'react';

import classNames from 'classnames';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className }) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <div className={classNames('animate-spin rounded-full border-2 border-gray-300 border-t-blue-600', sizeClasses[size], className)} />
    );
};
