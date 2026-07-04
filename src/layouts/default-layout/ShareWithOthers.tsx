import { memo, useState, useMemo, useCallback, useRef, useEffect } from 'react';

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

function ShareWithOthers() {
    const [showPanel, setShowPanel] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const togglePanel = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setShowPanel((prev) => !prev);
        trackShare();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setShowPanel(false);
            }
        };

        if (showPanel) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showPanel]);

    const { ratingUrl, gMailShare, linkedInShare, facebookShare, twitterShare } = useMemo(getUrls, []);

    return (
        <li className="nav-item relative list-none hidden md:block">
            <span
                className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-lg transition-colors text-(--text-secondary) hover:bg-(--bg-hover) hover:text-(--text-primary)"
                onClick={togglePanel}
                title="Click to rate or share Jira Assistant"
            >
                <i className="fa fa-share-alt text-sm" />
            </span>
            {showPanel && (
                <div
                    ref={panelRef}
                    className="absolute right-0 top-full mt-1 w-72 rounded-xl z-50 overflow-hidden bg-(--bg-primary) border border-(--border-primary) shadow-(--shadow-xl)"
                >
                    <div className="px-4 pt-4 pb-1 text-center font-semibold text-xs uppercase tracking-wider text-(--text-tertiary)">
                        Rate &amp; Share
                    </div>
                    <div className="p-4 grid grid-cols-5 gap-2">
                        <Link
                            href={ratingUrl}
                            className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-(--bg-hover) transition-colors no-underline group"
                            title="Rate this tool in web store"
                        >
                            <span className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                                <i className="fa fa-star text-amber-500 text-base" />
                            </span>
                            <span className="text-[10px] text-(--text-secondary) leading-tight text-center">Rate</span>
                        </Link>
                        <Link
                            href={gMailShare}
                            className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-(--bg-hover) transition-colors no-underline group"
                            title="Share with Gmail"
                        >
                            <span className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                                <i className="fa fa-envelope text-red-500 text-base" />
                            </span>
                            <span className="text-[10px] text-(--text-secondary) leading-tight text-center">Gmail</span>
                        </Link>
                        <Link
                            href={linkedInShare}
                            className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-(--bg-hover) transition-colors no-underline group"
                            title="Share with LinkedIn"
                        >
                            <span className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                <i className="fa-brands fa-linkedin text-blue-700 text-base" />
                            </span>
                            <span className="text-[10px] text-(--text-secondary) leading-tight text-center">LinkedIn</span>
                        </Link>
                        <Link
                            href={facebookShare}
                            className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-(--bg-hover) transition-colors no-underline group"
                            title="Share with Facebook"
                        >
                            <span className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                <i className="fa-brands fa-facebook text-blue-600 text-base" />
                            </span>
                            <span className="text-[10px] text-(--text-secondary) leading-tight text-center">Facebook</span>
                        </Link>
                        <Link
                            href={twitterShare}
                            className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-(--bg-hover) transition-colors no-underline group"
                            title="Share with Twitter / X"
                        >
                            <span className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center group-hover:bg-sky-200 transition-colors">
                                <i className="fa-brands fa-x-twitter text-sky-500 text-base" />
                            </span>
                            <span className="text-[10px] text-(--text-secondary) leading-tight text-center">Twitter</span>
                        </Link>
                    </div>
                </div>
            )}
        </li>
    );
}

export default memo(ShareWithOthers);

function trackShare() {
    const { $analytics } = inject('AnalyticsService');
    $analytics.trackEvent('Share option viewed', EventCategory.HeaderActions);
}

function getUrls() {
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
