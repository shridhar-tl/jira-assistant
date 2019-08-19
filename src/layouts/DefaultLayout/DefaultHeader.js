import React, { PureComponent } from 'react';
import { NavLink } from 'react-router-dom';
import { UncontrolledDropdown, DropdownItem, DropdownMenu, DropdownToggle, Nav, NavItem } from 'reactstrap';
import PropTypes from 'prop-types';

import { AppSidebarToggler } from '@coreui/react';
import logo from '../../img/logo-symbol.png';
import * as $ from 'jquery';
import { CHROME_WS_URL, FF_STORE_URL } from '../../_constants';

import './DefaultHeader.scss';
import { inject } from '../../services/injector-service';

const propTypes = {
  children: PropTypes.node,
};

const defaultProps = {};

class DefaultHeader extends PureComponent {
  constructor(props) {
    super(props);
    inject(this, "AppBrowserService", "CacheService", "SessionService", "UserService");
    var { jiraUser: { displayName, self, emailAddress, key, avatarUrls } } = this.$session.CurrentUser;
    this.state = { name: displayName, login: key, profile: self, emailAddress, imageUrl: avatarUrls["24x24"] };
  }

  UNSAFE_componentWillMount() {
    this.$user.getUsersList().then(users => this.setState({ users }));

    this.selectedSkin = this.$cache.get('skin', true) || 'skin-blue';
    this.skinClass = this.selectedSkin.replace('-light', '');
    this.useLightTheme = this.selectedSkin.indexOf('-light') > -1;
    this.ratingUrl = this.$jaBrowserExtn.getStoreUrl(true);
    this.storeUrl = this.$jaBrowserExtn.getStoreUrl();
    var subj = encodeURIComponent('Check out "Jira Assistant" in web store');
    var body = encodeURIComponent('Check out "Jira Assistant" extension / add-on for your browser from below url:'
      + '\n\nChrome users: ' + CHROME_WS_URL + "?utm_source%3Dgmail#"
      + '\n\nFirefox users: ' + FF_STORE_URL
      //+ '\n\nEdge users: <<Not available yet>>'
      //+ '\n\nSafari users: <<Not available yet>>'
      + '\n\n\n\nThis would help you to track your worklog and generate reports from Jira easily with lots of customizations. '
      + 'Also has lot more features like Google Calendar integration, Jira comment & meeting + worklog notifications, Worklog and custom report generations, etc..');
    var storeUrl = encodeURIComponent(this.storeUrl);
    this.gMailShare = "https://mail.google.com/mail/u/0/?view=cm&tf=1&fs=1&su=" + subj + "&body=" + body;
    this.gPlusShare = "https://plus.google.com/share?app=110&url=" + storeUrl;
    this.linkedInShare = "https://www.linkedin.com/shareArticle?mini=true&url=" + storeUrl + "&title=" + subj + "&summary=" + body + "&source=";
    this.fackbookShare = "https://www.facebook.com/sharer/sharer.php?u=" + storeUrl;
    this.twitterShare = "https://twitter.com/home?status=" + storeUrl;

    if (this.$session.CurrentUser.hideDonateMenu) { // When this settings is changed, below class will be removed from body in settings page
      $('body').addClass('no-donation');
    }
  }

  showVideo() {
    var url = "https://www.youtube.com/embed/f2aBSXzbYuA?rel=0&autoplay=1&showinfo=0&cc_load_policy=1&start=";
    var route = this.$location.url;
    var startAt = 0;
    var endAt = 0;
    switch (route) {
      case "/":
      default:
        startAt = 74;
        break;
      case "/calendar":
        startAt = 290;
        break;
      case "/reports/userdaywise":
        startAt = 538;
        break;
      case "/reports/customgrouped":
        startAt = 713;
        break;
      case "/settings":
        startAt = 1069;
        break;
      case "/feedback":
        startAt = 1147;
        break;
    }
    url += startAt + "&end=" + endAt;
    $('#ifVideoHelp').attr('src', url);
    this.showVideoHelp = true;
  }

  onHelpClosed() {
    this.showVideoHelp = false;
    $('#ifVideoHelp').attr('src', '#');
  }

  setSkin(skin, fromChk = false) {
    var passedSkin = skin;
    if (this.useLightTheme !== fromChk) {
      skin += '-light';
    }
    if (this.selectedSkin === skin) {
      return;
    }
    var body = $('body');
    body.removeClass(this.selectedSkin);
    this.skinClass = passedSkin;
    this.selectedSkin = skin;
    this.$cache.set('skin', skin, false, true);
    body.addClass(this.selectedSkin);
    $('#divSkins .selected').removeClass('selected');
    $('#divSkins .' + this.selectedSkin).addClass('selected');
  }

  logout() {
    this.$cache.clear();
    window.close();
    window.location.href = "/index.html";
  }

  render() {
    var {
      ratingUrl, gMailShare, gPlusShare, linkedInShare, fackbookShare, twitterShare,
      //REVISIT: props: { children, ...attributes },
      state: { name, login, profile, emailAddress, imageUrl, users }
    } = this;

    return (
      <React.Fragment>
        <AppSidebarToggler className="d-lg-none" display="md" mobile><span className="fa fa-bars" /></AppSidebarToggler>
        <a href={this.storeUrl} className="navbar-brand" target="_blank" rel="noopener noreferrer">
          <img src={logo} width="24" height="24" alt="Jira Assistant" className="navbar-brand-minimized" />
          <span className="navbar-brand-full">Jira Assistant</span>
        </a>
        <AppSidebarToggler className="d-md-down-none" display="lg"><span className="fa fa-bars" /></AppSidebarToggler>

        {/*<Nav className="d-md-down-none" navbar>
          <NavItem className="px-3">
            <NavLink to="/dashboard" className="nav-link" >Dashboard</NavLink>
          </NavItem>
          <NavItem className="px-3">
            <Link to="/users" className="nav-link">Users</Link>
          </NavItem>
          <NavItem className="px-3">
            <NavLink to="#" className="nav-link">Settings</NavLink>
          </NavItem>
        </Nav>*/}
        <Nav className="ml-auto" navbar>

          <UncontrolledDropdown nav direction="down">
            <DropdownToggle nav tag="div" style={{ cursor: "pointer" }}>
              <a href={profile} target="_blank" rel="noopener noreferrer" title={emailAddress}>
                <img src={imageUrl} className="img-avatar" alt={emailAddress} height={35} width={35} />
              </a> <span>{name} ({login})</span>
            </DropdownToggle>
            <DropdownMenu right>
              <DropdownItem header tag="div" className="text-center"><strong>Settings</strong></DropdownItem>
              <DropdownItem><i className="fa fa-user"></i> Profile</DropdownItem>
              <DropdownItem><i className="fa fa-wrench"></i> Settings</DropdownItem>

              {users && users.length > 0 && <>
                <DropdownItem header tag="div" className="text-center"><strong>Accounts</strong></DropdownItem>

                {users.map(u => <DropdownItem key={u.id} tag="a" href={"/index.html/#/" + u.id + "/dashboard/1"} title={u.jiraUrl}><i className="fa fa-external-link"></i> {u.email}</DropdownItem>)}

                <DropdownItem tag="a" href="/index.html/#/integrate" title="Integrate with new instance of Jira"><i className="fa fa-plug"></i> Integrate</DropdownItem>
                {
                 /*<DropdownItem><i className="fa fa-envelope-o"></i> Messages<Badge color="success">42</Badge></DropdownItem>
                <DropdownItem><i className="fa fa-tasks"></i> Tasks<Badge color="danger">42</Badge></DropdownItem>
                <DropdownItem><i className="fa fa-comments"></i> Comments<Badge color="warning">42</Badge></DropdownItem>
                */}
              </>
              }

              <DropdownItem divider />
              <DropdownItem onClick={e => this.props.onLogout(e)}><i className="fa fa-lock"></i> Logout</DropdownItem>
            </DropdownMenu>
          </UncontrolledDropdown>

          <NavItem className="d-md-down-none">
            <NavLink to="#" className="nav-link"><i className="fa fa-youtube-play"></i></NavLink>
          </NavItem>
          <NavItem className="d-md-down-none">
            <NavLink to="#" className="nav-link"><i className="fa fa-adjust"></i></NavLink>
          </NavItem>
          <UncontrolledDropdown nav direction="down">
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
                <a href={gPlusShare} target="_blank" rel="noopener noreferrer" title="Share with Google+">
                  <i className="fa fa-google-plus-square pull-left"></i>
                </a>
                <a href={linkedInShare} target="_blank" rel="noopener noreferrer" title="Share with Linked in">
                  <i className="fa fa-linkedin-square pull-left"></i>
                </a>
                <a href={fackbookShare} target="_blank" rel="noopener noreferrer" title="Share with Facebook">
                  <i className="fa fa-facebook-square pull-left"></i>
                </a>
                <a href={twitterShare} target="_blank" rel="noopener noreferrer" title="Share with Twitter" >
                  <i className="fa fa-twitter-square pull-left"></i>
                </a >
              </div>
            </DropdownMenu>
          </UncontrolledDropdown>
          <NavItem className="d-md-down-none">
            <NavLink to="/feedback" className="nav-link"><i className="fa fa-bug" title="Report a bug or suggest a new feature"></i></NavLink>
          </NavItem>
        </Nav>
        {/*<AppAsideToggler className="d-md-down-none"><span className="fa fa-bars" /></AppAsideToggler>*/}
        {/*<AppAsideToggler className="d-lg-none" mobile />*/}
      </React.Fragment >
    );
  }
}

DefaultHeader.propTypes = propTypes;
DefaultHeader.defaultProps = defaultProps;

export default DefaultHeader;
