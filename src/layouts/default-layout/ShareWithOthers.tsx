import { memo, useState, useMemo, useCallback } from 'react';

import { EventCategory } from '@/constants/settings';
import {
    CHROME_WS_URL,
    FF_STORE_URL,
    EDGE_STORE_URL,
    WebSiteUrl,
    OPERA_STORE_URL,
    JAWebRootUrl,
    CLOUD_INSTALL_URL,
} from '@/constants/urls';
import { Link } from '@/controls';

import { inject } from '@services';

import { OverlayPanel } from '@components';

import SidebarFooterAction from './SidebarFooterAction';

interface ShareUrls {
    ratingUrl: string;
    gMailShare: string;
    linkedInShare: string;
    facebookShare: string;
    twitterShare: string;
}

interface ShareTarget {
    urlKey: keyof ShareUrls;
    label: string;
    title: string;
    iconClass: string;
    badgeClass: string;
}

const shareTargets: ShareTarget[] = [
    {
        urlKey: 'ratingUrl',
        label: 'Rate',
        title: 'Rate this tool in web store',
        iconClass: 'fa fa-star text-amber-500',
        badgeClass: 'bg-amber-100 group-hover:bg-amber-200',
    },
    {
        urlKey: 'gMailShare',
        label: 'Gmail',
        title: 'Share with Gmail',
        iconClass: 'fa fa-envelope text-red-500',
        badgeClass: 'bg-red-100 group-hover:bg-red-200',
    },
    {
        urlKey: 'linkedInShare',
        label: 'LinkedIn',
        title: 'Share with LinkedIn',
        iconClass: 'fa-brands fa-linkedin text-blue-700',
        badgeClass: 'bg-blue-100 group-hover:bg-blue-200',
    },
    {
        urlKey: 'facebookShare',
        label: 'Facebook',
        title: 'Share with Facebook',
        iconClass: 'fa-brands fa-facebook text-blue-600',
        badgeClass: 'bg-blue-100 group-hover:bg-blue-200',
    },
    {
        urlKey: 'twitterShare',
        label: 'Twitter',
        title: 'Share with Twitter / X',
        iconClass: 'fa-brands fa-x-twitter text-sky-500',
        badgeClass: 'bg-sky-100 group-hover:bg-sky-200',
    },
];

interface ShareWithOthersProps {
    isHidden: boolean;
    onToggle: (isOpen: boolean) => void;
}

function ShareWithOthers({ isHidden, onToggle }: ShareWithOthersProps) {
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    const urls = useMemo(getUrls, []);
    const isOpen = !!anchor;

    const closePanel = useCallback(() => {
        setAnchor(null);
        onToggle(false);
    }, [onToggle]);

    const togglePanel = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            if (isOpen) {
                closePanel();
                return;
            }
            trackShare();
            setAnchor(e.currentTarget);
            onToggle(true);
        },
        [isOpen, closePanel, onToggle],
    );

    return (
        <>
            <SidebarFooterAction
                icon="fa-solid fa-share-nodes"
                label="Rate & share"
                isActive={isOpen}
                isHidden={isHidden}
                onClick={togglePanel}
                hasPopup
            />
            <OverlayPanel isOpen={isOpen} target={anchor} onClose={closePanel} title="Rate & Share" placement="topLeft" width="20rem">
                <div className="grid grid-cols-5 gap-1 sm:gap-2">
                    {shareTargets.map((target) => (
                        <Link
                            key={target.urlKey}
                            href={urls[target.urlKey]}
                            className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-(--bg-hover) transition-colors no-underline group cursor-pointer"
                            title={target.title}
                        >
                            <span className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${target.badgeClass}`}>
                                <i className={`${target.iconClass} text-base`} />
                            </span>
                            <span className="text-[10px] text-(--text-secondary) leading-tight text-center">{target.label}</span>
                        </Link>
                    ))}
                </div>
            </OverlayPanel>
        </>
    );
}

export default memo(ShareWithOthers);

function trackShare() {
    const { $analytics } = inject('AnalyticsService');
    $analytics.trackEvent('Share option viewed', EventCategory.HeaderActions);
}

function getUrls(): ShareUrls {
    const { $jaBrowserExtn } = inject('AppBrowserService');

    const ratingUrl = $jaBrowserExtn.getStoreUrl(true);
    const storeUrlRaw = $jaBrowserExtn.getStoreUrl();
    const subj = encodeURIComponent('Check out "Jira Assistant" in web store');
    const body = encodeURIComponent(
        'Check out "Jira Assistant", a open source extension / add-on for your browser from below url:' +
            `\n\nChrome users: ${CHROME_WS_URL}?utm_source%3Dgmail#` +
            `\n\nFirefox users: ${FF_STORE_URL}` +
            `\n\nEdge users: ${EDGE_STORE_URL}` +
            `\n\nOpera users: ${OPERA_STORE_URL}` +
            `\n\nUse Web version: ${JAWebRootUrl}` +
            `\n\nJira Cloud App: ${CLOUD_INSTALL_URL}` +
            `\n\nFor source code or to know more about the extension visit: ${WebSiteUrl}` +
            '\n\n\nThis would help you to track your worklog and generate reports from Jira easily with lots of customizations. ' +
            'Also has lot more features like Calendar integration, Jira comment & meeting + worklog notifications, Worklog, Sprint and custom report generations, etc..',
    );

    const storeUrl = encodeURIComponent(storeUrlRaw);
    const gMailShare = `https://mail.google.com/mail/u/0/?view=cm&tf=1&fs=1&su=${subj}&body=${body}`;
    const linkedInShare = `https://www.linkedin.com/shareArticle?mini=true&url=${storeUrl}&title=${subj}&summary=${body}&source=`;
    const facebookShare = `https://www.facebook.com/sharer/sharer.php?u=${storeUrl}&title=${subj}&description=${body}`;
    const twitterShare = `https://twitter.com/intent/tweet?text=${body}`;

    return { ratingUrl, gMailShare, linkedInShare, facebookShare, twitterShare };
}
