import { memo } from 'react';

import { NavLink } from 'react-router-dom';

import { isAppBuild, isPluginBuild } from '@/constants/build-info';
import { Icons } from '@/constants/icons';
import config from '@/customize';
import YoutubeVideo from '@/dialogs/YoutubeVideo';

import JiraUpdates from './JiraUpdates';
import LaunchWeb from './LaunchWeb';
import Notifications from './Notifications';
import ShareWithOthers from './ShareWithOthers';
import SkinPicker from './SkinPicker';
import UserBox from './UserBox';

const showShareOption = config.features.header.shareWithOthers !== false;
const allowWebVersion = config.features.common.allowWebVersion !== false;
const showYoutubeOption = config.features.header.youtubeHelp !== false;
const showContactUs = config.modules.contactUs !== false;

interface HeaderRightProps {
    showYoutubeVideo: boolean;
    notifications: any;
    showVersionInfo: (e: React.MouseEvent) => void;
    disableJiraUpdates: boolean;
    disableNotification: boolean;
    showYoutubeHelp: () => void;
    userId: number;
    hideYoutube: () => void;
    onLogout: (e: React.MouseEvent) => void;
    isQuickView?: boolean;
}

function HeaderRight(props: HeaderRightProps) {
    const {
        showYoutubeVideo,
        notifications,
        showVersionInfo,
        disableJiraUpdates,
        disableNotification,
        showYoutubeHelp,
        userId,
        hideYoutube,
        onLogout,
        isQuickView,
    } = props;

    const { version, isBeta } = notifications?.updatesAvailable || {};

    const showUserBox = !isQuickView && !isPluginBuild;

    return (
        <>
            <ul className="flex items-center gap-0.5 list-none m-0 p-0">
                {allowWebVersion && !isAppBuild && !isQuickView && <LaunchWeb />}
                {!!version && (
                    <li className="list-none mr-1">
                        <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full cursor-pointer transition-all shadow-sm hover:shadow ${isBeta ? 'bg-amber-400 text-amber-900 hover:bg-amber-500' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                            title={`Jira Assist ${isBeta ? 'BETA ' : ''}v${version} is now available. Click to know more.`}
                            onClick={showVersionInfo}
                        >
                            <i className="fa fa-download text-[10px]" /> Updates available
                        </span>
                    </li>
                )}
                {!disableJiraUpdates && <JiraUpdates />}
                {!disableNotification && notifications && <Notifications notifications={notifications} />}
                {showYoutubeOption && (
                    <li className="list-none hidden md:block">
                        <span
                            className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-lg transition-colors text-(--text-secondary) hover:bg-(--bg-hover) hover:text-(--text-primary)"
                            onClick={showYoutubeHelp}
                            title="Click to watch YouTube help video for current page"
                        >
                            {Icons.youtube}
                        </span>
                    </li>
                )}
                <SkinPicker />
                {showShareOption && <ShareWithOthers />}
                {showContactUs && (
                    <li className="list-none hidden md:block">
                        <NavLink
                            to={`/${userId}/contact-us`}
                            className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors no-underline text-(--text-secondary) hover:bg-(--bg-hover) hover:text-(--text-primary)"
                        >
                            <i className="fa fa-phone text-sm" title="Contact us" />
                        </NavLink>
                    </li>
                )}
                {showUserBox && (
                    <>
                        <li className="list-none mx-1.5 h-6 w-px bg-(--border-primary)" aria-hidden="true" />
                        <UserBox onLogout={onLogout} />
                    </>
                )}
            </ul>
            {showYoutubeOption && showYoutubeVideo && <YoutubeVideo onHide={hideYoutube} />}
        </>
    );
}

export default memo(HeaderRight);
