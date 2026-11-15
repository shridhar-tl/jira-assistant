import { memo } from 'react';

import { isAppBuild, isPluginBuild } from '@/constants/build-info';
import config from '@/customize';

import JiraUpdates from './JiraUpdates';
import LaunchWeb from './LaunchWeb';
import Notifications from './Notifications';
import SkinPicker from './SkinPicker';
import UserBox from './UserBox';

const allowWebVersion = config.features.common.allowWebVersion !== false;
const showThemePicker = config.features.header.themes !== false;

interface HeaderRightProps {
    notifications: any;
    showVersionInfo: (e: React.MouseEvent) => void;
    disableJiraUpdates: boolean;
    disableNotification: boolean;
    onLogout: (e: React.MouseEvent) => void;
    isQuickView?: boolean;
}

function HeaderRight(props: HeaderRightProps) {
    const { notifications, showVersionInfo, disableJiraUpdates, disableNotification, onLogout, isQuickView } = props;

    const { version, isBeta } = notifications?.updatesAvailable || {};

    const showUserBox = !isQuickView && !isPluginBuild;

    return (
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
            {showUserBox ? (
                <>
                    <li className="list-none mx-1.5 h-6 w-px bg-(--border-primary)" aria-hidden="true" />
                    <UserBox onLogout={onLogout} showThemeToggle={showThemePicker} />
                </>
            ) : (
                showThemePicker && <SkinPicker />
            )}
        </ul>
    );
}

export default memo(HeaderRight);
