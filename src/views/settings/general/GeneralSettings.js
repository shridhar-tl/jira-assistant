import React, { PureComponent } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { inject } from '../../../services';
import GeneralTab from './GeneralTab';
import WorklogTab from './WorklogTab';
import DefaultValuesTab from './DefaultValuesTab';
import MeetingsTab from './MeetingsTab';
import MenuOptionsTab from './MenuOptionsTab';
import './Common.scss';
import GlobalTab from './GlobalTab';

const isWebBuild = process.env.REACT_APP_WEB_BUILD === 'true';

class GeneralSettings extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, 'SessionService', 'SettingsService');
        this.state = { settings: {} };
        this.noDonations = this.$session.CurrentUser.noDonations;
        this.userId = this.$session.CurrentUser.userId;
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
            <TabView styleclass="query-tab" activeindex={currentTabIndex} onChange={this.tabChanged}>
                <TabPanel header="Global" leftIcon="fa fa-globe" selected="true">
                    <GlobalTab />
                </TabPanel>
                <TabPanel header="General" leftIcon="fa fa-cogs" selected="true">
                    <GeneralTab settings={settings} userId={this.userId} noDonations={noDonations} onSave={this.saveSetting} />
                </TabPanel>
                <TabPanel header="Worklog" leftIcon="fa fa-clock-o">
                    <WorklogTab settings={settings} userId={this.userId} onSave={this.saveSetting} />
                </TabPanel>
                <TabPanel header="Default values" leftIcon="fa fa-list">
                    <DefaultValuesTab settings={settings} userId={this.userId} onSave={this.saveSetting} />
                </TabPanel >
                <TabPanel header="Meetings" leftIcon="fa fa-calendar">
                    <MeetingsTab settings={settings} userId={this.userId} onSave={this.saveSetting} onChange={this.stateChanged} />
                </TabPanel >
                {(!isWebBuild || this.isExtnConnected) && <TabPanel header="Menu options" leftIcon="fa fa-bars">
                    <MenuOptionsTab settings={settings} userId={this.userId} onSave={this.saveSetting} />
                </TabPanel>}
            </TabView>
        </>
        );
    }
}

export default GeneralSettings;