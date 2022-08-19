import React, { PureComponent } from 'react';
import { NavLink } from 'react-router-dom';
import { UncontrolledDropdown, DropdownItem, DropdownMenu, DropdownToggle, Nav, NavItem } from 'reactstrap';

import { AppSidebarToggler } from '@coreui/react';
import logo from '../../img/logo-symbol.png';
import { AppVersionNo } from '../../constants/common';
import { EventCategory } from '../../constants/settings';
import { CHROME_WS_URL, FF_STORE_URL, EDGE_STORE_URL, WebSiteUrl, OPERA_STORE_URL } from '../../constants/urls';

import './DefaultHeader.scss';
import { inject } from '../../services/injector-service';
import YoutubeVideo from '../../dialogs/YoutubeVideo';
import SkinPicker from './SkinPicker';
import SwitchAccountOption from './SwitchAccountMenu';
import { getHostFromUrl } from '../../common/utils';
import Notifications from './Notifications';
import JiraUpdates from './JiraUpdates';
import Dialog from '../../dialogs';
import UpdatesInfo from './UpdatesInfo';
import LaunchWeb from './LaunchWeb';
import BackupImporter from './BackupImporter';
import TimerControl from './header/TimerControl';
import { isWebBuild } from '../../constants/build-info';

class DefaultHeader extends PureComponent {
  constructor(props) {
    super(props);
    inject(this, "AppBrowserService", "SessionService", "NotificationService", "AnalyticsService");
    const cUser = this.$session.CurrentUser;
    this.disableNotification = cUser.disableDevNotification;
    this.disableJiraUpdates = cUser.disableJiraUpdates;
    this.userId = cUser.userId;
    this.currentJiraInstance = getHostFromUrl(cUser.jiraUrl);
    this.state = {};
    this.versionNumber = isWebBuild ? 'WEB' : `v ${AppVersionNo}`;
    this.initComponent();
  }

  initComponent() {
    this.$noti.getNotifications().then(notifications => this.setState({ notifications }),
      (err) => { console.error("Error fetching notifications: ", err); });

    this.siteUrl = WebSiteUrl;
    this.ratingUrl = this.$jaBrowserExtn.getStoreUrl(true);
    this.storeUrl = this.$jaBrowserExtn.getStoreUrl();
    const subj = encodeURIComponent('Check out "Jira Assistant" in web store');
    const body = encodeURIComponent('Check out "Jira Assistant", a open source extension / add-on for your browser from below url:'
      + `\n\nChrome users: ${CHROME_WS_URL}?utm_source%3Dgmail#`
      + `\n\nFirefox users: ${FF_STORE_URL}`
      + `\n\nEdge users: ${EDGE_STORE_URL}`
      + `\n\nOpera users: ${OPERA_STORE_URL}`
      + `\n\nFor source code or to know more about the extension visit: ${WebSiteUrl}`
      + `\n\n\nThis would help you to track your worklog and generate reports from Jira easily with lots of customizations. `
      + `Also has lot more features like Google Calendar integration, Jira comment & meeting + worklog notifications, Worklog, Sprint and custom report generations, etc..`);
    const storeUrl = encodeURIComponent(this.storeUrl);
    this.gMailShare = `https://mail.google.com/mail/u/0/?view=cm&tf=1&fs=1&su=${subj}&body=${body}`;
    this.linkedInShare = `https://www.linkedin.com/shareArticle?mini=true&url=${storeUrl}&title=${subj}&summary=${body}&source=`;
    this.fackbookShare = `https://www.facebook.com/sharer/sharer.php?u=${this.storeUrl}&title=${subj}&description=${body}`;
    this.twitterShare = `https://twitter.com/intent/tweet?text=${body}`;

    if (this.$session.CurrentUser.hideDonateMenu) { // When this settings is changed, below class will be removed from body in settings page
      document.body.classList.add('no-donation');
    }
  }

  trackShare = () => this.$analytics.trackEvent("Share option viewed", EventCategory.HeaderActions);
  showYoutubeHelp = () => this.setState({ showYoutubeVideo: true });
  hideYoutube = () => this.setState({ showYoutubeVideo: false });

  showVersionInfo = (e) => {
    e.preventDefault();
    const updates = this.state.notifications?.updates_info;
    if (!updates) { return; }

    Dialog.alert(<UpdatesInfo updates={updates} />, "Updates info", { width: "600px" }).then();
  };

  render() {
    const {
      ratingUrl, gMailShare, linkedInShare, fackbookShare, twitterShare,
      state: { showYoutubeVideo, notifications }
      //REVISIT: props: { children, ...attributes }
    } = this;

    const { version, isBeta } = notifications?.updatesAvailable || {};

    return (
      <React.Fragment>
        <AppSidebarToggler className="d-lg-none quick-view-hide" display="md" mobile><span className="fa fa-bars" /></AppSidebarToggler>
        <a href={this.siteUrl} className="navbar-brand" target="_blank" rel="noopener noreferrer">
          <img src={logo} width="24" height="24" alt="Jira Assistant" className="navbar-brand-minimized" />
          <span className="navbar-brand-full">Jira Assistant <span className="v-info badge badge-success" onClick={this.showVersionInfo}>{this.versionNumber}</span></span>
        </a>
        <AppSidebarToggler className="d-md-down-none quick-view-hide" display="lg"><span className="fa fa-bars" /></AppSidebarToggler>
        <button className="navbar-toggler quick-view-show"><a href="/index.html" target="_blank" title="Open in new tab"><span className="fa fa-external-link" /></a></button>
        <NavLink to={`/${this.userId}/contribute`} className="btn-donate"
          title="Would you like to contribute / compensate us for the effort we put in development of this tool? Click to know more">
          <img src="/assets/donate.png" width="145" className="margin-r-5" alt="Donate us" />
        </NavLink>
        <TimerControl />
        <Nav className="ml-auto" navbar>
          <BackupImporter>
            {(importSettings) => <SwitchAccountOption instance={this.currentJiraInstance} onLogout={this.props.onLogout} onImport={importSettings} />}
          </BackupImporter>
          <LaunchWeb />
          {!!version && <span className={`update-available badge badge-${isBeta ? "warning" : "success"}`}
            title={`Jira Assist ${isBeta ? 'BETA ' : ''}v${version} is now available. Click to know more.`}
            onClick={this.showVersionInfo}><i className="fa fa-download" /> Updates available</span>}
          {!this.disableJiraUpdates && <JiraUpdates />}
          {!this.disableNotification && notifications && <Notifications notifications={notifications} />}
          <NavItem className="d-md-down-none">
            <span className="nav-link" onClick={this.showYoutubeHelp}><i className="fa fa-youtube-play"></i></span>
          </NavItem>
          <UncontrolledDropdown nav direction="down">
            <DropdownToggle nav>
              <i className="fa fa-adjust"></i>
            </DropdownToggle>
            <DropdownMenu right>
              <SkinPicker />
            </DropdownMenu>
          </UncontrolledDropdown>
          <UncontrolledDropdown nav direction="down" onClick={this.trackShare}>
            <DropdownToggle nav>
              <i className="fa fa-share-alt"></i>
            </DropdownToggle>
            <DropdownMenu right>
              <DropdownItem header tag="div" className="text-center">
                <strong className="share-header-text">Share or rate this tool</strong>
              </DropdownItem>
              <div className="share-items">
                <a href={ratingUrl} target="_blank" rel="noopener noreferrer" title="Click to rate this tool or add a comment in chrome web store">
                  <i className="fa fa-star pull-left"></i>
                </a>
                <a href={gMailShare} target="_blank" rel="noopener noreferrer" title="Share with GMail">
                  <i className="fa fa-envelope pull-left"></i>
                </a>
                <a href={linkedInShare} target="_blank" rel="noopener noreferrer" title="Share with Linked in">
                  <i className="fa fa-linkedin-square pull-left"></i>
                </a>
                <a href={fackbookShare} target="_blank" rel="noopener noreferrer" title="Share with Facebook">
                  <i className="fa fa-facebook-square pull-left"></i>
                </a>
                <a href={twitterShare} target="_blank" rel="noopener noreferrer" title="Share with Twitter" >
                  <i className="fa fa-twitter-square pull-left"></i>
                </a>
              </div>
            </DropdownMenu>
          </UncontrolledDropdown>
          <NavItem className="d-md-down-none">
            <NavLink to={`/${this.userId}/contactus`} className="nav-link"><i className="fa fa-phone" title="Contact us"></i></NavLink>
          </NavItem>
        </Nav>
        {showYoutubeVideo && <YoutubeVideo onHide={this.hideYoutube} />}
        {/*<AppAsideToggler className="d-md-down-none"><span className="fa fa-bars" /></AppAsideToggler>*/}
        {/*<AppAsideToggler className="d-lg-none" mobile />*/}
      </React.Fragment >
    );
  }
}

export default DefaultHeader;
