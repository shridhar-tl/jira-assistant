import React from 'react';
import Link from '../../../controls/Link';
import { isWebBuild } from '../../../constants/build-info';
import { WebSiteUrl } from '../../../constants/urls';
import config from '../../../customize';

const showShareOption = config.features.header.shareWithOthers !== false;
const siteUrl = showShareOption ? WebSiteUrl : undefined;

function HeaderBrand({ showVersionInfo, versionNumber }) {
    return (<>
        <Link href={siteUrl} className="navbar-brand">
            {/*<img src={process.env.PUBLIC_URL + '/assets/icon_24.png'} width="24" height="24" alt="Jira Assistant" className="navbar-brand-minimized" />*/}
            <span className="navbar-brand-full">Jira Assistant <span className="v-info badge bg-success" onClick={showVersionInfo}>{versionNumber}</span></span>
        </Link>
        <button className="navbar-toggler quick-view-show">
            <Link href={isWebBuild ? "/" : "/index.html"} title="Open in new tab">
                <span className="fa fa-external-link" /></Link>
        </button>
    </>);
}

export default HeaderBrand;