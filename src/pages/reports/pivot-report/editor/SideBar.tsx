import classNames from 'classnames';

import { Button } from '@components';

interface SideBarProps {
    title: string;
    onBackClick?: () => void;
    show: boolean;
    onHide: () => void;
    children: React.ReactNode;
    contentClassName?: string;
    controls?: React.ReactNode;
    width?: string;
}

export default function SideBar({ title, onBackClick, show, onHide, children, contentClassName, controls, width = '400' }: SideBarProps) {
    return (
        <div
            className={classNames(
                'border-l border-[--border-primary] bg-[--bg-primary] sticky top-0 shrink-0 overflow-hidden transition-all duration-500',
                show ? 'opacity-100' : 'w-0 opacity-0 border-l-0',
            )}
            style={show ? { width: `${width}px`, height: 'calc(100vh - 32px)' } : undefined}
        >
            <div className="flex flex-col" style={{ width: `${width}px`, height: 'calc(100vh - 32px)' }}>
                <div className={classNames('flex items-center gap-2 px-4 py-2 border-b border-[--border-primary] bg-[--bg-secondary]', onBackClick ? 'pl-2' : '')}>
                    {onBackClick && (
                        <Button layout="plain" leftIcon={<span className="fa fa-arrow-left" />} onClick={onBackClick} title="Configure data source" />
                    )}
                    <h2 className="flex-1 font-semibold text-sm pt-1">{title}</h2>
                    {controls}
                    <Button layout="plain" leftIcon={<span className="fa fa-times" />} onClick={onHide} title="Hide this block" />
                </div>
                <div className={classNames('flex-1 overflow-hidden', contentClassName)}>{children}</div>
            </div>
        </div>
    );
}
