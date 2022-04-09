import React, { PureComponent } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { inject } from '../../../services';
import GeneralTab from './GeneralTab';
import WorklogTab from './WorklogTab';
import DefaultValuesTab from './DefaultValuesTab';
import MeetingsTab from './MeetingsTab';
import MenuOptionsTab from './MenuOptionsTab';
import './Common.scss';

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
    }

    componentDidMount() {
        this.$settings.getGeneralSettings(this.userId)
            .then(settings => this.setState({ settings }));
    }

    tabChanged = (e) => this.setState({ currentTabIndex: e.index });

    render() {
        const { noDonations, state: { settings, currentTabIndex } } = this;

        if (!settings) {
            return null;
        }

        return (<>
            <TabView styleclass="query-tab" activeindex={currentTabIndex} onChange={this.tabChanged}>
                <TabPanel header="General" lefticon="fa-filter" selected="true">
                    <GeneralTab settings={settings} userId={this.userId} noDonations={noDonations} />
                </TabPanel>
                <TabPanel header="Worklog" lefticon="fa-clock-o">
                    <WorklogTab settings={settings} userId={this.userId} />
                </TabPanel>
                <TabPanel header="Default values" lefticon="fa-clock-o">
                    <DefaultValuesTab settings={settings} userId={this.userId} />
                </TabPanel >
                <TabPanel header="Meetings" lefticon="fa-calendar">
                    <MeetingsTab settings={settings} userId={this.userId} />
                </TabPanel >
                <TabPanel header="Menu options" lefticon="fa-calendar">
                    <MenuOptionsTab settings={settings} userId={this.userId} />
                </TabPanel>
            </TabView>
        </>
        );
    }
}

export default GeneralSettings;