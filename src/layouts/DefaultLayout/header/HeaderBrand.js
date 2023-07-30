import React from 'react';
import Link from '../../../controls/Link';
import { isWebBuild } from '../../../constants/build-info';
import { WebSiteUrl } from '../../../constants/urls';
import config from '../../../customize';

const showShareOption = config.features.header.shareWithOthers !== false;
const siteUrl = showShareOption ? WebSiteUrl : undefined;

function HeaderBrand({ showVersionInfo, versionNumber }) {
    return (<>
        <AppSidebarToggler className="d-lg-none quick-view-hide" display="md" mobile><span className="fa fa-bars" /></AppSidebarToggler>
        <Link href={siteUrl} className="navbar-brand">
            {/*<img src={process.env.PUBLIC_URL + '/assets/icon_24.png'} width="24" height="24" alt="Jira Assistant" className="navbar-brand-minimized" />*/}
            <span className="navbar-brand-full">Jira Assistant <span className="v-info badge badge-success" onClick={showVersionInfo}>{versionNumber}</span></span>
        </Link>
        <AppSidebarToggler className="d-md-down-none quick-view-hide" display="lg"><span className="fa fa-bars" /></AppSidebarToggler>
        <button className="navbar-toggler quick-view-show">
            <Link href={isWebBuild ? "/" : "/index.html"} title="Open in new tab">
                <span className="fa fa-external-link" /></Link>
        </button>
    </>);
}

export default HeaderBrand;

function AppSidebarToggler({ className, display }) {
    const onClick = React.useCallback(() => {
        document.body.classList.toggle(`sidebar-${display}-show`);
    }, [display]);

    return (<span className={className} style={{ marginLeft: 17, marginRight: 17, paddingTop: 2, cursor: 'pointer' }} onClick={onClick}><span className="fa fa-bars" /></span>);
}