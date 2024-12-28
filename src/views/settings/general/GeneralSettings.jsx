import React, { PureComponent } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import config from '../../../customize';
import { inject } from '../../../services';
import GeneralTab from './GeneralTab';
import GlobalTab from './TimeTrackerTab';
import WorklogTab from './WorklogTab';
import DefaultValuesTab from './DefaultValuesTab';
import MeetingsTab from './MeetingsTab';
import MenuOptionsTab from './MenuOptionsTab';
import { isPluginBuild, isWebBuild } from '../../../constants/build-info';
import './Common.scss';

const { googleCalendar, outlookCalendar } = config.features.integrations;
const showMeetingsTab = googleCalendar !== false || outlookCalendar !== false;

class GeneralSettings extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, 'SessionService', 'SettingsService');
        this.state = { settings: {} };
        this.noDonations = this.$session.CurrentUser.noDonations;
        this.userId = this.$session.CurrentUser.userId;
        this.isAtlasCloud = this.$session.CurrentUser.isAtlasCloud;
        this.settings = {};
        this.spaceInfo = {};
        this.state = {};
        if (isWebBuild) {
            this.isExtnConnected = localStorage.getItem('authType') === '1';
        }
    }

    componentDidMount() {
        this.$settings.getGeneralSettings(this.userId)
            .then(settings => this.setState({
                settings: {
                    autoLaunch: 0,
                    notifyBefore: 0,
                    checkUpdates: 15,
                    ...settings
                }
            }));
    }

    tabChanged = (e) => this.setState({ currentTabIndex: e.index });

    saveSetting = (value, field) => {
        this.stateChanged(field, value);
        this.$settings.saveGeneralSetting(this.userId, field, value);

        const cUser = this.$session.CurrentUser;
        cUser[field] = value;
    };

    stateChanged = (field, value) => {
        let { settings } = this.state;
        settings = { ...settings };
        settings[field] = value;

        this.setState({ settings });
    };

    render() {
        const { noDonations, state: { settings, currentTabIndex } } = this;

        if (!settings) {
            return null;
        }

        return (<>
            <TabView activeindex={currentTabIndex} onChange={this.tabChanged}>
                <TabPanel header="General" leftIcon="fa fa-cogs" selected="true">
                    <GeneralTab settings={settings} userId={this.userId} noDonations={noDonations} onSave={this.saveSetting} />
                </TabPanel>
                <TabPanel header="Time tracker" leftIcon="fa fa-clock">
                    <GlobalTab />
                </TabPanel>
                <TabPanel header="Worklog" leftIcon="fa fa-clock">
                    <WorklogTab settings={settings} userId={this.userId} onSave={this.saveSetting} isAtlasCloud={this.isAtlasCloud} />
                </TabPanel>
                <TabPanel header="Default values" leftIcon="fa fa-list">
                    <DefaultValuesTab settings={settings} userId={this.userId} onSave={this.saveSetting} />
                </TabPanel >
                {showMeetingsTab && <TabPanel header="Meetings" leftIcon="fa fa-calendar">
                    <MeetingsTab settings={settings} userId={this.userId} onSave={this.saveSetting} onChange={this.stateChanged} />
                </TabPanel>}
                {(!isWebBuild || this.isExtnConnected) && !isPluginBuild && <TabPanel header="Menu options" leftIcon="fa fa-bars">
                    <MenuOptionsTab settings={settings} userId={this.userId} onSave={this.saveSetting} />
                </TabPanel>}
            </TabView>
        </>
        );
    }
}

export default GeneralSettings;