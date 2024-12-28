import React from 'react';
import TabControlBase from './TabControlBase';
import { SelectBox, Checkbox } from '../../../controls';
import { inject } from '../../../services';
import { ApiUrls } from '../../../constants/api-urls';
import Dialog from '../../../dialogs';
import config from '../../../customize';

const intervalList = [
    { value: 5, label: 'Every 5 minutes' },
    { value: 10, label: 'Every 10 minutes' },
    { value: 15, label: 'Every 15 minutes' },
    { value: 20, label: 'Every 20 minutes' },
    { value: 30, label: 'Every 30 minutes' },
    { value: 45, label: 'Every 45 minutes' },
    { value: 60, label: 'Every 60 minutes' },
];

const notificationList = [
    { value: 0, label: "Disable notification" },
    { value: 1, label: "Before 1 minute" },
    { value: 2, label: "Before 2 minutes" },
    { value: 3, label: "Before 3 minutes" },
    { value: 4, label: "Before 4 minutes" },
    { value: 5, label: "Before 5 minutes" },
    { value: 10, label: "Before 10 minutes" },
    { value: 15, label: "Before 15 minutes" }
];

const launchList = [
    { value: 0, label: "Never launch" },
    { value: 1, label: "Before 1 minute" },
    { value: 2, label: "Before 2 minutes" },
    { value: 3, label: "Before 3 minutes" },
    { value: 4, label: "Before 4 minutes" },
    { value: 5, label: "Before 5 minutes" },
    { value: 10, label: "Before 10 minutes" }
];

const { googleCalendar, outlookCalendar } = config.features.integrations;

class MeetingsTab extends TabControlBase {
    constructor(props) {
        super(props);
        this.state = {};
        inject(this, "CalendarService", "AnalyticsService", "MessageService", "SessionService", "OutlookService", "AppBrowserService");
    }

    intgStatusChanged = (removedIntg) => this.setState({ removedIntg });

    enableIntegration(key, val) {
        if (val) {
            this.$jaBrowserExtn.requestPermission(["identity"]).then(result => {
                if (result) {
                    this.saveSetting(val, key);
                } else {
                    this.$message.warning("Permission was not granted to enable this integration. Please grant permission to enable it.", "Permission not granted");
                }
            });
        } else {
            this.saveSetting(val, key);
        }
    }

    enableGIntegration = (val) => this.enableIntegration("googleIntegration", val);
    enableOIntegration = (val) => this.saveSetting(val, "outlookIntegration");

    googleSignIn = () => {
        this.$calendar.authenticate(true).then((result) => {
            this.saveSetting(true, "hasGoogleCredentials");
            this.$session.CurrentUser.hasGoogleCredentials = true;
            this.$analytics.trackEvent("Signedin to Google Calendar");
            this.$message.success("Successfully integrated with google account.");
        }, (err) => { this.$message.warning("Unable to integrate with Google Calendar!"); });
    };

    outlookSignIn = () => {
        this.$outlook.authenticate(true).then(() => {
            this.$session.CurrentUser.hasOutlookCredentials = true;
            this.$analytics.trackEvent("Signedin to Outlook Calendar");
            this.$message.success("Successfully integrated with outlook account.");
            this.props.onChange('hasOutlookCredentials', true); // No need to save this setting. So just update state
        }, (err) => {
            console.log("Outlook integration failed with error: ");
            console.error(err);
            this.$message.warning("Unable to integrate with Outlook Calendar!");
        });
    };

    removeIntegration = () => {
        this.saveSetting(false, "hasGoogleCredentials");
        this.props.intgStatusChanged(true); //removedIntg
    };

    undoSignout = () => {
        this.saveSetting(true, "hasGoogleCredentials");
        this.props.intgStatusChanged(false); //removedIntg
    };

    removeOutlookIntegration = () => {
        Dialog.confirmDelete(<>
            Are you sure to remove Outlook Integration?
            <br />
            <br />
            To use it again, you will have to reintegrate with MS Outlook.
        </>,
            "Remove Integration")
            .then(() => {
                this.$settings.saveGeneralSetting(this.props.userId, 'OLBT', null);
                this.$settings.saveGeneralSetting(this.props.userId, 'OLRT', null);
                this.saveSetting(false, "hasOutlookCredentials");
            });
    };

    // ToDo: This method is not yet implemneted / called
    assignCalendarSettingsToUser(user, settings) {
        if (!settings.hasGoogleCredentials && user.dataStore) {
            const tokken = user.dataStore.access_token;
            if (tokken) {
                this.$ajax.get(ApiUrls.googleLogoutUrl, tokken).then(() => {
                    this.$jaBrowserExtn.removeAuthTokken(tokken);
                });
            }
            delete user.dataStore;
        }
    }

    render() {
        const { removedIntg, settings } = this.props;

        return (
            <div>
                <p>
                    This page allows you to integrate your calendar from external sources like Outlook & Google. Worklog will be automatically created
                    for the events in your calendar based on your preferences
                </p>
                <div className="block">
                    {outlookCalendar !== false && <div className="ui-g ui-fluid">
                        <div><h4>Outlook Calendar</h4></div>
                        <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Enable Outlook calendar</strong>
                        </div>
                        <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group">
                                <Checkbox checked={settings.outlookIntegration}
                                    onChange={this.enableOIntegration} label="Allow integration" />
                                <span className="help-block">Select this checkbox if you would wish to view meetings in your outlook calendar</span>
                            </div>
                        </div>
                        <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Integration Status</strong>
                        </div>
                        <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            {!settings.hasOutlookCredentials && <div className="form-group">
                                <label className="link" onClick={this.outlookSignIn}>Click here to sign in with your microsoft account</label>
                                <span className="help-block">You will have to sign-in to with your microsoft account to use the calendar.</span>
                            </div>}
                            {settings.hasOutlookCredentials && <div className="form-group">
                                <label>(Already integrated with an account)</label>
                                <label className="link margin-l-5" onClick={this.removeOutlookIntegration}>Remove integration</label>
                            </div>}
                        </div>
                    </div>}
                    {googleCalendar !== false && <div className="ui-g ui-fluid">
                        <h4>Google Calendar</h4>
                        <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Enable Google calendar</strong>
                        </div>
                        <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group">
                                <Checkbox checked={settings.googleIntegration}
                                    onChange={this.enableGIntegration} label="Allow integration" />
                                <span className="help-block">Select this checkbox if you would wish to view meetings in your calendar</span>
                            </div>
                        </div>
                        <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Integration Status</strong>
                        </div>
                        <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            {!settings.hasGoogleCredentials && !removedIntg && <div className="form-group">
                                <label className="link" onClick={this.googleSignIn}>Click here to sign in with your google account</label>
                                <span className="help-block">You will have to sign-in to chrome with your google account to use the calendar.</span>
                            </div>}
                            {settings.hasGoogleCredentials && !removedIntg && <div className="form-group">
                                <label>(Already integrated with an account)</label>
                                <label className="link" onClick={this.removeIntegration}>Remove integration</label>
                            </div>}
                            {removedIntg && <div className="form-group">
                                <label>(You will be signed out from Google once you save your changes)</label>
                                <label className="link" onClick={this.undoSignout}> Undo signout</label>
                                <span className="help-block">Note: You will have to authenticate with google again to use the calendar</span>
                            </div>}
                        </div>
                    </div>}
                    {googleCalendar !== false && <div>
                        <h4>General settings</h4>
                        <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Check for updates</strong>
                        </div>
                        <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group">
                                <SelectBox className="form-control select" value={settings.checkUpdates} dataset={intervalList}
                                    valueField="value" field="checkUpdates" onChange={this.saveSetting}
                                    style={{ width: 180, display: 'inline-block' }} />
                                <span className="help-block">Refresh the meeting invites for notification regularly in given interval</span>
                            </div>
                        </div>
                        <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Show meeting notification</strong>
                        </div>
                        <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group">
                                <SelectBox className="form-control select" value={settings.notifyBefore} dataset={notificationList} valueField="value"
                                    field="notifyBefore" onChange={this.saveSetting} style={{ width: 180, display: 'inline-block' }} />
                                <span className="help-block">Show notification before the selected time of meeting</span>
                            </div>
                        </div>
                        <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Auto launch hangout</strong>
                        </div>
                        <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group">
                                <SelectBox className="form-control select" value={settings.autoLaunch} field="autoLaunch" onChange={this.saveSetting}
                                    dataset={launchList} valueField="value" style={{ width: 180, display: 'inline-block' }} />
                                <span className="help-block">Automatically launch hangout Url before the selected time of meeting</span>
                            </div>
                        </div>
                    </div>}
                </div>
            </div>
        );
    }
}

export default MeetingsTab;