import React from 'react';
import { UncontrolledDropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';
import { EventCategory } from '../../../constants/settings';
import { CHROME_WS_URL, FF_STORE_URL, EDGE_STORE_URL, WebSiteUrl, OPERA_STORE_URL, JAWebRootUrl, CLOUD_INSTALL_URL } from '../../../constants/urls';
import Link from '../../../controls/Link';
import { inject } from '../../../services/injector-service';

function ShareWithOthers() {
    const { $jaBrowserExtn, $analytics } = inject('AppBrowserService', 'AnalyticsService');

    const ratingUrl = $jaBrowserExtn.getStoreUrl(true);
    const storeUrlRaw = $jaBrowserExtn.getStoreUrl();
    const subj = encodeURIComponent('Check out "Jira Assistant" in web store');
    const body = encodeURIComponent('Check out "Jira Assistant", a open source extension / add-on for your browser from below url:'
        + `\n\nChrome users: ${CHROME_WS_URL}?utm_source%3Dgmail#`
        + `\n\nFirefox users: ${FF_STORE_URL}`
        + `\n\nEdge users: ${EDGE_STORE_URL}`
        + `\n\nOpera users: ${OPERA_STORE_URL}`
        + `\n\nUse Web version: ${JAWebRootUrl}`
        + `\n\nJira Cloud App: ${CLOUD_INSTALL_URL}`
        + `\n\nFor source code or to know more about the extension visit: ${WebSiteUrl}`
        + `\n\n\nThis would help you to track your worklog and generate reports from Jira easily with lots of customizations. `
        + `Also has lot more features like Calendar integration, Jira comment & meeting + worklog notifications, Worklog, Sprint and custom report generations, etc..`);

    const storeUrl = encodeURIComponent(storeUrlRaw);
    const gMailShare = `https://mail.google.com/mail/u/0/?view=cm&tf=1&fs=1&su=${subj}&body=${body}`;
    const linkedInShare = `https://www.linkedin.com/shareArticle?mini=true&url=${storeUrl}&title=${subj}&summary=${body}&source=`;
    const fackbookShare = `https://www.facebook.com/sharer/sharer.php?u=${storeUrl}&title=${subj}&description=${body}`;
    const twitterShare = `https://twitter.com/intent/tweet?text=${body}`;

    const trackShare = () => $analytics.trackEvent("Share option viewed", EventCategory.HeaderActions);

    return (<UncontrolledDropdown nav direction="down" onClick={trackShare}>
        <DropdownToggle nav className="notification-icon">
            <i className="fa fa-share-alt"></i>
        </DropdownToggle>
        <DropdownMenu end className="notification-menu">
            <DropdownItem header tag="div" className="notification-title">
                <strong className="share-header-text">Share or rate this tool</strong>
            </DropdownItem>
            <div className="share-items">
                <Link href={ratingUrl} title="Click to rate this tool or add a comment in chrome web store">
                    <i className="fa fa-star float-start"></i>
                </Link>
                <Link href={gMailShare} title="Share with Gmail">
                    <i className="fa fa-envelope float-start"></i>
                </Link>
                <Link href={linkedInShare} title="Share with Linked in">
                    <i className="fa-brands fa-linkedin float-start"></i>
                </Link>
                <Link href={fackbookShare} title="Share with Facebook">
                    <i className="fa-brands fa-facebook-square float-start"></i>
                </Link>
                <Link href={twitterShare} title="Share with Twitter" >
                    <i className="fa-brands fa-twitter-square float-start"></i>
                </Link>
            </div>
        </DropdownMenu>
    </UncontrolledDropdown>);
}

export default React.memo(ShareWithOthers);