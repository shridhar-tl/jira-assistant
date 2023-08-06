import React, { PureComponent } from 'react';
import { NavLink } from 'react-router-dom';
import { AppVersionNo } from '../../constants/common';
import { inject } from '../../services/injector-service';
import { getHostFromUrl } from '../../common/utils';
import Dialog from '../../dialogs';
import UpdatesInfo from './UpdatesInfo';
import TimerControl from './header/TimerControl';
import { isWebBuild } from '../../constants/build-info';
import config from '../../customize';
import moment from 'moment';
import { Button } from '../../controls';
import HeaderBrand from './header/HeaderBrand';
import HeaderRight from './header/HeaderRight';
import { SettingsCategory } from '../../constants/settings';
import './DefaultHeader.scss';

const showDonateButton = !!config.modules.contribute;

class DefaultHeader extends PureComponent {
  constructor(props) {
    super(props);
    inject(this, "AppBrowserService", "SessionService", "NotificationService", "AnalyticsService", "SettingsService");
    const cUser = this.$session.CurrentUser;
    this.disableNotification = !config.features?.header?.devUpdates || cUser.disableDevNotification;
    this.disableJiraUpdates = config.features?.header?.jiraUpdates === false || cUser.disableJiraUpdates;
    this.userId = cUser.userId;
    this.currentJiraInstance = getHostFromUrl(cUser.jiraUrl);
    this.state = {};
    this.versionNumber = isWebBuild ? 'WEB' : `v ${AppVersionNo}`;
  }

  componentDidMount() {
    if (!this.disableNotification) {
      this.$noti.getNotifications().then(notifications => this.setState({ notifications }),
        (err) => { console.error("Error fetching notifications: ", err); });
    }

    if (this.$session.CurrentUser.hideDonateMenu) { // When this settings is changed, below class will be removed from body in settings page
      document.body.classList.add('no-donation');
    }

    this.validateTimezone();
  }

  async validateTimezone() {
    const ignoreTimezone = await this.$settings.getSetting(this.userId, SettingsCategory.General, 'ignoreTimezone');
    if (ignoreTimezone) {
      return;
    }

    const systemTimezone = moment.tz.guess(true);
    const jiraTimeZone = this.$session.CurrentUser.jiraUser.timeZone;

    const now = moment.utc();
    const systemOffset = moment.tz.zone(systemTimezone).offset(now);
    const jiraOffset = moment.tz.zone(jiraTimeZone).offset(now);

    const getOffsetForDisplay = (value) => {
      const isNegative = value > 0; // Should show negative if value is possitive
      value = Math.abs(value);
      if (!value) { return 'GMT'; }
      value = parseFloat((value / 60).toFixed(2));
      return `GMT ${isNegative ? '-' : '+'} ${value} hours`;
    };

    if (systemOffset !== jiraOffset) {
      const footer = (confirm, cancel) => <>
        <Button type="danger" icon="fa fa-times" label="Ok, Do not check again" onClick={confirm} waitFor={5} />
        <Button type="primary" icon="fa fa-check" label="Ok, I will update Jira profile" onClick={cancel} />
      </>;

      Dialog.custom(
        <span>Your system timezone mismatches with Jira profile timezone.
          This would cause differences in date or time while worklog is being pulled.
          Ensure you update your Jira profile to match with your local timezone. <br /><br />
          <strong>
            Jira Profile Timezone: {jiraTimeZone} ({getOffsetForDisplay(jiraOffset)})<br />
            Your System Timezone: {systemTimezone} ({getOffsetForDisplay(systemOffset)})
          </strong><br /><br />
          Any worklogs you already added directly from within Jira would continue to remain
          same and new worklogs would start using new timezone.<br /><br />
        </span>
        , 'Timezone mismatch', footer, { maxWidth: '80vw', width: '700px' }, 'dlgTimezoneDiff')
        .then(() => this.$settings.saveSetting(this.userId, SettingsCategory.General, 'ignoreTimezone', true));
    }
  }

  showYoutubeHelp = () => this.setState({ showYoutubeVideo: true });
  hideYoutube = () => this.setState({ showYoutubeVideo: false });

  showVersionInfo = (e) => {
    e.preventDefault();
    const updates = this.state.notifications?.updates_info;
    if (!updates) { return; }

    Dialog.alert(<UpdatesInfo updates={updates} />, "Updates info", { width: '90vw', maxWidth: '1000px' }, { acceptLabel: 'Close' }).then();
  };

  render() {
    const {
      state: { showYoutubeVideo, notifications }
      //REVISIT: props: { children, ...attributes }
    } = this;

    return (
      <header className="app-header navbar">
        <HeaderBrand showVersionInfo={this.showVersionInfo} versionNumber={this.versionNumber} />

        {showDonateButton && <NavLink to={`/${this.userId}/contribute`} className="btn-donate"
          title="Would you like to contribute / compensate us for the effort we put in development of this tool? Click to know more">
          <img src="/assets/donate.png" width="145" className="margin-r-5" alt="Donate us" />
        </NavLink>}
        <TimerControl />

        <HeaderRight showYoutubeVideo={showYoutubeVideo} notifications={notifications}
          onLogout={this.props.onLogout} currentJiraInstance={this.currentJiraInstance}
          showVersionInfo={this.showVersionInfo}
          disableJiraUpdates={this.disableJiraUpdates}
          disableNotification={this.disableNotification}
          showYoutubeHelp={this.showYoutubeHelp}
          userId={this.userId}
          hideYoutube={this.hideYoutube}
          isQuickView={this.props.isQuickView}
        />
      </header>
    );
  }
}

export default DefaultHeader;
