import React, { ReactNode } from 'react';

import classNames from 'classnames';

import { Button } from '@components';

interface SidebarProps {
    title: string;
    show: boolean;
    onHide: () => void;
    children: ReactNode;
    contentClassName?: string;
}

function Sidebar({ title, show, onHide, children, contentClassName }: SidebarProps) {
    return (
        <div className={classNames('say-do-sidebar-container', show ? 'open' : 'closed')}>
            <div className="say-do-sidebar-block">
                <div className="say-do-sidebar-header">
                    <h2 className="say-do-sidebar-title">{title}</h2>
                    <Button
                        layout="plain"
                        leftIcon={<i className="fa fa-times" />}
                        onClick={onHide}
                        title="Close"
                        className="text-white! hover:opacity-80!"
                    />
                </div>
                <div className={classNames('say-do-sidebar-content', contentClassName)}>{children}</div>
            </div>
        </div>
    );
}

export default Sidebar;
