import React, { PureComponent } from 'react';
import $ from 'jquery';
import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from '../../../controls';
import { inject } from '../../../services';
import GeneralTab from './GeneralTab';
import './Common.scss'
import WorklogTab from './WorklogTab';
import DefaultValuesTab from './DefaultValuesTab';
import MeetingsTab from './MeetingsTab';
import MenuOptionsTab from './MenuOptionsTab';

class GeneralSettings extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "AppBrowserService", "SessionService", "MessageService", "CacheService", "ConfigService", "TicketService");

        this.noDonations = true;
        this.settings = {};
        this.spaceInfo = {};
        this.state = {};
    }

    UNSAFE_componentWillMount() {
        /*this.$jaBrowserExtn.getStorageInfo().then((info) => {
            this.spaceInfo = info;
            var progressClass = 'progress-bar-';
            if (info.usedSpacePerc < 50) {
                progressClass += 'green';
            }
            else if (info.usedSpacePerc <= 75) {
                progressClass += 'yellow';
            }
            else {
                progressClass += 'red';
            }
            this.spaceInfo.progressClass = progressClass;
        });*/

        this.$config.getUserSettings().then(this.parseSettings);
    }

    saveSettings() {
        var validateTicket = () => {
            let tickets = (this.settings.meetingTicket || "").trim();
            if (tickets) {
                tickets = tickets.replace(';', ',').replace(' ', ',');
                tickets = tickets.split(',').map(t => t.trim() || null);
                this.settings.meetingTicket = tickets.join();
                return this.$ticket.getTicketDetails(tickets).then(res => {
                    var list = tickets.map(t => res[t.toUpperCase()] || t);
                    var invalidTickets = list.filter(t => typeof t === "string");
                    if (invalidTickets.length > 0) {
                        this.$message.warning("Invalid default ticket number(s) specified for meetings: " + invalidTickets.join());
                        return false;
                    }
                    this.settings.meetingTicket = list.map(t => t.key).join();
                    return true;
                }, e => {
                    var msgs = ((e.error || {}).errorMessages || []);
                    if (msgs.some(m => m.toLowerCase().indexOf("'key' is invalid") > -1 || m.toLowerCase().indexOf("does not exist") > -1)) {
                        this.$message.warning("Invalid default ticket number specified for meetings!");
                    }
                    return false;
                });
            }
            else {
                return Promise.resolve(true);
            }
        };
        validateTicket().then((result) => {
            if (result === false) {
                this.setState({ currentTabIndex: 1 });
                return;
            }
            if (!this.settings.storyPointField) {
                // Find the field with exact match
                var spF = this.state.numericFields.first(cf => cf.name.toLowerCase() === "story points");
                // IF exact match is not available then find a field with both the words
                if (!spF) {
                    this.state.numericFields.first(cf => {
                        var name = cf.name.toLowerCase();
                        return name.indexOf('story') > -1 && ~name.indexOf('points') > -1;
                    });
                }
                if (spF) {
                    this.settings.storyPointField = spF;
                }
            }
            if (!this.settings.epicNameField) {
                // Find the field with exact match
                var enF = this.state.stringFields.first(cf => cf.name.toLowerCase() === "epic link");
                // IF exact match is not available then find a field with both the words
                if (!enF) {
                    this.state.stringFields.first(cf => {
                        var name = cf.name.toLowerCase();
                        return name.indexOf('epic') > -1 && ~name.indexOf('link') > -1;
                    });
                }
                if (enF) {
                    this.settings.epicNameField = enF;
                }
            }
            if (!(this.settings.startOfWeek > 0)) {
                delete this.settings.startOfWeek;
            }
            this.$config.saveUserSettings(this.settings).then(res => {
                this.menuActionsTab.setLaunchAction();
                this.parseSettings(res);
            });
        });
    }
    parseSettings = (result) => {
        var cUser = this.$session.CurrentUser;
        var sett = this.settings = result.settings;
        cUser.dateFormat = sett.dateFormat;
        cUser.timeFormat = sett.timeFormat;
        cUser.workingDays = sett.workingDays;
        cUser.gIntegration = sett.googleIntegration;
        cUser.maxHours = sett.maxHours;
        cUser.meetingTicket = sett.meetingTicket;
        cUser.hasGoogleCreds = sett.hasGoogleCredentials;
        cUser.allowClosedTickets = sett.allowClosedTickets;
        cUser.pruneInterval = parseInt(sett.pruneInterval || 4);
        cUser.projects = sett.projects;
        cUser.rapidViews = sett.rapidViews;
        cUser.storyPointField = sett.storyPointField;
        cUser.epicNameField = sett.epicNameField;
        cUser.commentLength = parseInt(sett.commentLength || 0);
        cUser.startOfWeek = parseInt(sett.startOfWeek || 0);
        this.noDonations = cUser.noDonations;
        cUser.hideDonateMenu = this.noDonations || sett.hideDonateMenu;
        if (cUser.hideDonateMenu) {
            $('body').addClass('no-donation');
        }
        else {
            $('body').removeClass('no-donation');
        }
        if (!sett.launchAction) {
            sett.launchAction = {};
            sett.menuAction = '1';
        }
        else {
            sett.menuAction = '' + sett.launchAction.action;
        }
        sett.autoLaunch = "" + (sett.autoLaunch || 0);
        sett.notifyBefore = "" + (sett.notifyBefore || 0);
        sett.checkUpdates = "" + (sett.checkUpdates || 15);
        cUser.team = sett.teamMembers;
        if (sett.startOfDay) {
            let temp = sett.startOfDay.split(':');
            cUser.startOfDay = temp[0] + ':' + temp[1];
        }
        if (sett.endOfDay) {
            let temp = sett.endOfDay.split(':');
            cUser.endOfDay = temp[0] + ':' + temp[1];
        }
        this.setState({ removedIntg: false });
    }

    tabChanged = (e) => this.setState({ currentTabIndex: e.index })
    settingsChanged = (settings) => this.setState({ settings })
    intgStatusChanged = (removedIntg) => this.setState({ removedIntg })

    render() {
        var {
            settings, noDonations,
            //props: { },
            state: { currentTabIndex, removedIntg }
        } = this;

        return (<>
            <TabView styleclass="query-tab" activeindex={currentTabIndex} onChange={($event) => currentTabIndex = $event.index}>
                <TabPanel header="General" lefticon="fa-filter" selected="true">
                    <GeneralTab settings={settings} noDonations={noDonations} onChange={this.settingsChanged} />
                </TabPanel>
                <TabPanel header="Worklog" lefticon="fa-clock-o">
                    <WorklogTab settings={settings} onChange={this.settingsChanged} />
                </TabPanel>
                <TabPanel header="Default values" lefticon="fa-clock-o">
                    <DefaultValuesTab settings={settings} onChange={this.settingsChanged} />
                </TabPanel >
                <TabPanel header="Meetings" lefticon="fa-calendar">
                    <MeetingsTab settings={settings} onChange={this.settingsChanged} removedIntg={removedIntg} intgStatusChanged={this.intgStatusChanged} />
                </TabPanel >
                <TabPanel header="Menu options" lefticon="fa-calendar">
                    <MenuOptionsTab ref={(r) => this.menuActionsTab = r} settings={settings} onChange={this.settingsChanged} />
                </TabPanel>
            </TabView>
            <div className="pnl-footer">
                <Button type="primary" className="pull-right" icon="fa fa-floppy-o" label="Save Changes" onClick={this.saveSettings} />
            </div>
        </>
        );
    }
}

export default GeneralSettings;