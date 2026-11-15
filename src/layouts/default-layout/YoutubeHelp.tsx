import { memo, useCallback, useState } from 'react';

import YoutubeVideo from '@/dialogs/YoutubeVideo';

import SidebarFooterAction from './SidebarFooterAction';

interface YoutubeHelpProps {
    isHidden: boolean;
    onOpen: () => void;
}

function YoutubeHelp({ isHidden, onOpen }: YoutubeHelpProps) {
    const [isOpen, setIsOpen] = useState(false);

    const showVideo = useCallback(() => {
        setIsOpen(true);
        onOpen();
    }, [onOpen]);

    const hideVideo = useCallback(() => setIsOpen(false), []);

    return (
        <>
            <SidebarFooterAction
                icon="fa-brands fa-youtube"
                label="Help videos"
                tone="red"
                isActive={isOpen}
                isHidden={isHidden}
                onClick={showVideo}
                hasPopup
            />
            {isOpen && <YoutubeVideo onHide={hideVideo} />}
        </>
    );
}

export default memo(YoutubeHelp);
