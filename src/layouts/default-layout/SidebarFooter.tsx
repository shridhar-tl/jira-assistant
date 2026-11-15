import { memo } from 'react';

import config from '@/customize';

import BuildDate from './BuildDate';
import ShareWithOthers from './ShareWithOthers';
import SidebarFooterAction from './SidebarFooterAction';
import YoutubeHelp from './YoutubeHelp';

type FooterAction = 'youtube' | 'share' | 'contact';

const enabledActions: Record<FooterAction, boolean> = {
    youtube: config.features.header.youtubeHelp !== false,
    share: config.features.header.shareWithOthers !== false,
    contact: config.modules.contactUs !== false,
};

const footerActions = (Object.keys(enabledActions) as FooterAction[]).filter((action) => enabledActions[action]);

interface SidebarFooterProps {
    userId?: number;
    pathname: string;
    isExpanded: boolean;
    onPanelToggle: (isOpen: boolean) => void;
    onDialogOpen: () => void;
}

function SidebarFooter({ userId, pathname, isExpanded, onPanelToggle, onDialogOpen }: SidebarFooterProps) {
    if (!footerActions.length && !isExpanded) {
        return null;
    }

    const contactUrl = userId ? `/${userId}/contact-us` : '/contact-us';
    const isContactActive = pathname === contactUrl || pathname.startsWith(contactUrl + '/');

    return (
        <div className="jira-sidebar-footer shrink-0 px-2 py-2">
            {footerActions.length > 0 && (
                <div className="flex items-center gap-1 px-1">
                    {footerActions.map((action, index) => {
                        const isHidden = !isExpanded && index > 0;

                        switch (action) {
                            case 'youtube':
                                return <YoutubeHelp key={action} isHidden={isHidden} onOpen={onDialogOpen} />;
                            case 'share':
                                return <ShareWithOthers key={action} isHidden={isHidden} onToggle={onPanelToggle} />;
                            case 'contact':
                                return (
                                    <SidebarFooterAction
                                        key={action}
                                        icon="fa-solid fa-headset"
                                        label="Contact us"
                                        isActive={isContactActive}
                                        isHidden={isHidden}
                                        to={contactUrl}
                                    />
                                );
                        }
                    })}
                </div>
            )}
            {isExpanded && (
                <div className={footerActions.length ? 'px-1 pt-2 text-[10px] truncate' : 'px-1 text-[10px] truncate'}>
                    <BuildDate />
                </div>
            )}
        </div>
    );
}

export default memo(SidebarFooter);
