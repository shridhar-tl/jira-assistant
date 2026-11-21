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
    const panelWidth = `min(${width}px, 100vw)`;

    return (
        <div
            className={classNames(
                'shrink-0 overflow-hidden border-l border-(--border-primary) bg-(--bg-primary) transition-all duration-500',
                'max-md:fixed max-md:right-0 max-md:top-12 max-md:z-40 max-md:h-[calc(100dvh-3rem)] max-md:shadow-2xl',
                'md:h-full',
                show ? 'opacity-100' : 'w-0 border-l-0 opacity-0',
            )}
            style={show ? { width: panelWidth } : undefined}
        >
            <div className="flex h-full flex-col" style={{ width: panelWidth }}>
                <div
                    className={classNames(
                        'flex items-center gap-2 border-b border-(--border-primary) bg-(--bg-secondary) px-4 py-2',
                        onBackClick ? 'pl-2' : '',
                    )}
                >
                    {onBackClick && (
                        <Button
                            layout="plain"
                            leftIcon={<span className="fa fa-arrow-left" />}
                            onClick={onBackClick}
                            title="Configure data source"
                        />
                    )}
                    <h2 className="min-w-0 flex-1 truncate pt-1 text-sm font-semibold">{title}</h2>
                    {controls}
                    <Button layout="plain" leftIcon={<span className="fa fa-times" />} onClick={onHide} title="Hide this block" />
                </div>
                <div className={classNames('min-h-0 flex-1 overflow-hidden', contentClassName)}>{children}</div>
            </div>
        </div>
    );
}
