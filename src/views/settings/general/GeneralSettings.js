import React, { PureComponent } from 'react';
import $ from 'jquery';
import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from '../../../controls';
import { inject } from '../../../services';
import GeneralTab from './GeneralTab';
import { navigation } from '../../../_nav';
import './Common.scss';
import WorklogTab from './WorklogTab';
import DefaultValuesTab from './DefaultValuesTab';
import MeetingsTab from './MeetingsTab';
import MenuOptionsTab from './MenuOptionsTab';

class GeneralSettings extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "AppBrowserService", "SessionService", "MessageService", "CacheService", "ConfigService", "TicketService", "JiraService", "DashboardService");

        this.noDonations = this.$session.CurrentUser.noDonations;
        this.userId = this.$session.CurrentUser.userId;
        this.settings = {};
        this.spaceInfo = {};
        this.state = {};
    }

    UNSAFE_componentWillMount() {
        /*this.$jaBrowserExtn.getStorageInfo().then((info) => {
            this.spaceInfo = info;
            const progressClass = 'progress-bar-';
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

        this.$jira.getRapidViews().then((rapidViews) => {
            rapidViews = rapidViews.orderBy((d) => { return d.name; }).map((d) => {
                return { name: d.name, id: d.id };
            });

            this.setState({ rapidViews });

            //if (this.props.settings.rapidViews && this.props.settings.rapidViews.length > 0) {
            //  this.props.settings.rapidViews = this.rapidViews
            //}
        });

        this.$jira.getProjects().then((projects) => {
            projects = projects.map((d) => { return { name: d.name, id: d.id, key: d.key }; }).orderBy((d) => d.name);
            this.setState({ projects });
        });

        this.$jira.getCustomFields().then(cfList => {
            const numericFields = cfList.filter(cf => cf.custom && cf.schema.type === "number")
                .map(cf => { return { id: cf.id, name: cf.name, clauseNames: cf.clauseNames }; })
                .orderBy(cf => cf.name);

            const stringFields = cfList.filter(cf => cf.custom && (cf.schema.type === "any" || cf.schema.type === "string"))
                .map(cf => { return { id: cf.id, name: cf.name, clauseNames: cf.clauseNames }; })
                .orderBy(cf => cf.name);

            this.setState({ numericFields, stringFields });
        });

        this.$config.getUserSettings().then(this.parseSettings);
    }

    fillMenus() {
        const menus = [];
        const launchAct = this.settings.launchAction;
        const selMenus = launchAct.selectedMenu || ['D-0', 'R-UD', 'R-SP', 'R-CG', 'CAL', 'S-GE'];

        const dashboards = this.$dashboard.getDashboards();
        const dashboardMenus = [];
        dashboards.forEach((d, i) => {
            const id = `D-${i}`;
            const url = `/dashboard/${i}`;
            menus.push({ id, name: d.name, icon: d.icon, url, selected: selMenus.indexOf(id) > -1 });
            dashboardMenus.push({ value: id, label: d.name, icon: d.icon });
        });

        const launchMenus = [{ label: "Dashboards", items: dashboardMenus }];
        let lastGroup = null;
        navigation.forEach(menu => {
            if (menu.name && !menu.isDashboard) {
                menus.push({
                    id: menu.id, isHead: menu.title, name: menu.name, icon: menu.icon,
                    url: menu.url, selected: selMenus.indexOf(menu.id) > -1
                });
                if (menu.title) {
                    lastGroup = { label: menu.name, items: [] };
                    launchMenus.push(lastGroup);
                }
                else {
                    lastGroup.items.push({ value: menu.id, label: menu.name, icon: menu.icon });
                }
            }
        });

        this.menus = menus;
        this.launchMenus = launchMenus;
        this.dashboardMenus = dashboardMenus;
    }

    validateTicket() {
        let tickets = (this.settings.meetingTicket || "").trim();
        if (tickets) {
            tickets = tickets.replace(';', ',').replace(' ', ',');
            tickets = tickets.split(',').map(t => t.trim() || null);
            this.settings.meetingTicket = tickets.join();
            return this.$ticket.getTicketDetails(tickets).then(res => {
                const list = tickets.map(t => res[t.toUpperCase()] || t);
                const invalidTickets = list.filter(t => typeof t === "string");
                if (invalidTickets.length > 0) {
                    this.$message.warning(`Invalid default ticket number(s) specified for meetings: ${invalidTickets.join()}`);
                    return false;
                }
                this.settings.meetingTicket = list.map(t => t.key).join();
                return true;
            }, e => {
                const msgs = ((e.error || {}).errorMessages || []);
                if (msgs.some(m => m.toLowerCase().indexOf("'key' is invalid") > -1 || m.toLowerCase().indexOf("does not exist") > -1)) {
                    this.$message.warning("Invalid default ticket number specified for meetings!");
                }
                return false;
            });
        }
        else {
            return Promise.resolve(true);
        }
    }

    saveSettings = () => {
        const { settings } = this;
        const setting = { action: parseInt(settings.menuAction) };
        const launchSetting = { action: setting.action };
        settings.launchAction = setting;

        switch (settings.menuAction) {
            case 1:
                launchSetting.menus = this.menus.filter(menu => menu.selected && !menu.isHead).map(menu => {
                    return { name: menu.name, url: menu.url };
                });
                setting.selectedMenu = this.selectedMenu;
                break;
            case 2:
                if (this.selectedLaunchPage) {
                    const selLPage = this.menus.first(menu => menu.id === this.selectedLaunchPage);
                    if (selLPage) {
                        launchSetting.url = selLPage.url;
                        setting.autoLaunch = this.selectedLaunchPage;
                    }
                }
                break;
            case 3:
                if (this.selectedDashboard) {
                    launchSetting.index = parseInt((this.selectedDashboard || '0').replace('D-', ''));
                    setting.quickIndex = this.selectedDashboard;
                }
                break;
            default: break;
        }

        this.validateTicket().then((result) => {
            if (result === false) {
                this.setState({ currentTabIndex: 1 });
                return;
            }

            if (!this.settings.storyPointField) {
                // Find the field with exact match
                const spF = this.state.numericFields.first(cf => cf.name.toLowerCase() === "story points");
                // IF exact match is not available then find a field with both the words
                if (!spF) {
                    this.state.numericFields.first(cf => {
                        const name = cf.name.toLowerCase();
                        return name.indexOf('story') > -1 && ~name.indexOf('points') > -1;
                    });
                }
                if (spF) {
                    this.setValue("storyPointField", spF);
                }
            }

            if (!this.settings.epicNameField) {
                // Find the field with exact match
                const enF = this.state.stringFields.first(cf => cf.name.toLowerCase() === "epic link");
                // IF exact match is not available then find a field with both the words
                if (!enF) {
                    this.state.stringFields.first(cf => {
                        const name = cf.name.toLowerCase();
                        return name.indexOf('epic') > -1 && ~name.indexOf('link') > -1;
                    });
                }
                if (enF) {
                    this.setValue("epicNameField", enF);
                }
            }

            if (!(this.settings.startOfWeek > 0)) {
                delete this.settings.startOfWeek;
            }
            this.$config.saveUserSettings(this.settings).then(res => {
                this.$cache.set("menuAction", launchSetting, false, true);
                this.parseSettings(res);
            });
        });
    }

    setValue = (field, value) => {
        const { settings } = this;

        if (value) {
            settings[field] = value;
        }
        else {
            delete settings[field];
        }

        this.settings = { ...settings };
        this.setState({ settings: this.settings });
    }

    launchPageChanged = (val) => {
        const launchAction = {};
        launchAction.action = 2;
        launchAction.autoLaunch = val;

        this.selectedLaunchPage = val;
        this.setValue("launchAction", launchAction);
        console.log("launchAction", launchAction);
    }

    menusChanged = (val) => this.selectedMenu = val
    dashboardChanged = (val) => {
        const launchAction = {};
        launchAction.action = 3;
        launchAction.quickIndex = val;

        this.selectedDashboard = val;
        this.setValue("launchAction", launchAction);
    }

    parseSettings = (result) => {
        const cUser = this.$session.CurrentUser;
        const sett = this.settings = result.settings;
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
            sett.menuAction = 1;
        }
        else {
            sett.menuAction = sett.launchAction.action;
        }

        sett.autoLaunch = (sett.autoLaunch || 0);
        sett.notifyBefore = (sett.notifyBefore || 0);
        sett.checkUpdates = (sett.checkUpdates || 15);
        cUser.team = sett.teamMembers;
        if (sett.startOfDay) {
            const temp = sett.startOfDay.split(':');
            cUser.startOfDay = `${temp[0]}:${temp[1]}`;
        }
        if (sett.endOfDay) {
            const temp = sett.endOfDay.split(':');
            cUser.endOfDay = `${temp[0]}:${temp[1]}`;
        }

        this.fillMenus();

        this.setState({ removedIntg: false, settings: this.settings });
    }

    tabChanged = (e) => this.setState({ currentTabIndex: e.index })
    settingsChanged = (settings) => this.setState({ settings })
    intgStatusChanged = (removedIntg) => this.setState({ removedIntg })

    render() {
        const {
            settings, noDonations,
            //props: { },
            state: { currentTabIndex, removedIntg, numericFields, stringFields, projects, rapidViews }
        } = this;

        return (<>
            <TabView styleclass="query-tab" activeindex={currentTabIndex} onChange={this.tabChanged}>
                <TabPanel header="General" lefticon="fa-filter" selected="true">
                    <GeneralTab settings={settings} noDonations={noDonations} userId={this.userId} onChange={this.settingsChanged} />
                </TabPanel>
                <TabPanel header="Worklog" lefticon="fa-clock-o">
                    <WorklogTab settings={settings} onChange={this.settingsChanged} />
                </TabPanel>
                <TabPanel header="Default values" lefticon="fa-clock-o">
                    <DefaultValuesTab ref={(r) => this.defaultValuesTab = r} settings={settings} onChange={this.settingsChanged}
                        numericFields={numericFields} stringFields={stringFields} projects={projects} rapidViews={rapidViews}
                    />
                </TabPanel >
                <TabPanel header="Meetings" lefticon="fa-calendar">
                    <MeetingsTab settings={settings} onChange={this.settingsChanged} removedIntg={removedIntg} intgStatusChanged={this.intgStatusChanged} />
                </TabPanel >
                <TabPanel header="Menu options" lefticon="fa-calendar">
                    <MenuOptionsTab key={settings._uniqueId} ref={(r) => this.menuActionsTab = r} settings={settings}
                        dashboards={this.dashboardMenus} menus={this.menus} launchMenus={this.launchMenus}
                        onChange={this.settingsChanged} menusChanged={this.menusChanged}
                        launchPageChanged={this.launchPageChanged} dashboardChanged={this.dashboardChanged}
                    />
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