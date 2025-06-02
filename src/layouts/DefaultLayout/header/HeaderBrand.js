import React from 'react';
import Link from '../../../controls/Link';
import { isWebBuild } from '../../../constants/build-info';
import { WebSiteUrl } from '../../../constants/urls';
import config from '../../../customize';
import './HeaderBrand.scss';

const showShareOption = config.features.header.shareWithOthers !== false;
const siteUrl = showShareOption ? WebSiteUrl : undefined;

function HeaderBrand({ showVersionInfo, versionNumber }) {
    return (<div className="logo-container">
        <Link href={siteUrl} className="navbar-brand logo">
            <img src={`${process.env.PUBLIC_URL}/assets/icon_32.png`} width="32" height="32" alt="Jira Assistant" className="brand-logo" />
            <h1 className="navbar-brand-full"><span className="brand-char">J</span>ira <span className="brand-char">A</span>ssistant</h1>
            <span className="v-info badge badge-success" onClick={showVersionInfo}>{versionNumber}</span>
        </Link>
        <button className="btn header-btn-collapse-nav d-lg-none" data-bs-toggle="collapse" data-bs-target=".header-nav">
            <i className="fas fa-bars"></i>
        </button>
        <button className="navbar-toggler quick-view-show"><Link href={isWebBuild ? "/" : "/index.html"} title="Open in new tab"><span className="fa fa-external-link" /></Link></button>
        <div className="d-md-none toggle-sidebar-left" data-toggle-class="sidebar-left-opened" data-target="html" data-fire-event="sidebar-left-opened">
            <i className="fas fa-bars" aria-label="Toggle sidebar"></i>
        </div>
    </div>);
}

export default HeaderBrand;