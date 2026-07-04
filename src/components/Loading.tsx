import React from 'react';

import classNames from 'classnames';
import { LoadingIcon } from 'fluxo-ui/icons';

interface LoadingProps {
    size?: 'sm' | 'md' | 'lg';
    variant?: 'spinner' | 'skeleton' | 'dots';
    className?: string;
}

const Loading: React.FC<LoadingProps> = ({ size = 'md', variant = 'spinner', className = '' }) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
    };

    if (variant === 'spinner') {
        return (
            <div className={classNames('flex items-center justify-center', className)}>
                <LoadingIcon className={classNames(sizeClasses[size], 'animate-spin text-blue-600')} />
            </div>
        );
    }

    if (variant === 'dots') {
        const dotSizeClasses = {
            sm: 'w-1 h-1',
            md: 'w-2 h-2',
            lg: 'w-3 h-3',
        };

        return (
            <div className={classNames('flex items-center justify-center space-x-1', className)}>
                <div
                    className={classNames(dotSizeClasses[size], 'bg-blue-600 rounded-full animate-bounce')}
                    style={{ animationDelay: '0ms' }}
                ></div>
                <div
                    className={classNames(dotSizeClasses[size], 'bg-blue-600 rounded-full animate-bounce')}
                    style={{ animationDelay: '150ms' }}
                ></div>
                <div
                    className={classNames(dotSizeClasses[size], 'bg-blue-600 rounded-full animate-bounce')}
                    style={{ animationDelay: '300ms' }}
                ></div>
            </div>
        );
    }

    if (variant === 'skeleton') {
        return (
            <div className={classNames('animate-pulse', className)}>
                <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    return null;
};

export const LoadingSpinner: React.FC<Omit<LoadingProps, 'variant'>> = (props) => <Loading {...props} variant="spinner" />;

export const LoadingDots: React.FC<Omit<LoadingProps, 'variant'>> = (props) => <Loading {...props} variant="dots" />;

export const LoadingSkeleton: React.FC<Omit<LoadingProps, 'variant'>> = (props) => <Loading {...props} variant="skeleton" />;

export const InlineLoading: React.FC<{ text?: string; size?: 'sm' | 'md' }> = ({ text = 'Loading...', size = 'sm' }) => (
    <div className="inline-flex items-center space-x-2">
        <LoadingIcon className={classNames(size === 'sm' ? 'w-4 h-4' : 'w-5 h-5', 'animate-spin text-blue-600')} />
        <span className={classNames(size === 'sm' ? 'text-sm' : 'text-base', 'text-gray-600')}>{text}</span>
    </div>
);

export const BlockLoading: React.FC<{
    text?: string;
    size?: 'sm' | 'md' | 'lg';
}> = ({ text = 'Loading...', size = 'md' }) => (
    <div className="flex flex-col items-center justify-center py-12">
        <LoadingIcon
            className={classNames(size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-12 h-12' : 'w-16 h-16', 'animate-spin text-blue-600 mb-4')}
        />
        <p className={classNames(size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg', 'text-gray-600')}>{text}</p>
    </div>
);

export { Loading };
