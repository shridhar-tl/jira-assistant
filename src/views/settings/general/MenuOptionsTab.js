import React from 'react';
import TabControlBase from './TabControlBase';
import { Checkbox, SelectBox, RadioButton } from '../../../controls';
import { ListBox } from 'primereact/listbox';
import { navigation } from '../../../_nav';
import { inject } from '../../../services';

class MenuOptionsTab extends TabControlBase {
    constructor(props) {
        super(props);
        inject(this, "DashboardService", "CacheService");
        const { settings } = props;

        if (!settings.launchAction) {
            settings.launchAction = {};
        }

        const { launchAction: { action, autoLaunch, quickIndex } } = settings;

        this.state = {
            settings: settings, launchMenus: [],
            menuAction: action || 1,
            selectedLaunchPage: autoLaunch,
            selectedDashboard: quickIndex
        };

        // ToDo: Appropriate quick index has to be assigned.
        //const idx = user.dashboards.indexOf(user.dashboards.first(d => d.isQuickView));
        //settings.launchAction.quickIndex = `D-${idx}`;

        this.fillMenus();
    }

    fillMenus() {
        const menus = [];
        const launchAct = this.state.settings.launchAction;
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

    menuActionSelected = (menuAction) => this.setState({ menuAction });

    launchPageChanged = (autoLaunch) => this.setState({ selectedLaunchPage: autoLaunch }, this.saveSettings);

    dashboardChanged = (quickIndex) => {
        this.setState({ selectedDashboard: quickIndex }, this.saveSettings);
        // ToDo: Updating appropriate dashboard index is not yet implemented
        //const idx = parseInt((user.launchAction.quickIndex || '0').replace('D-', '')) || 0;
        //delete user.launchAction.quickIndex;
        //user.dashboards.forEach((dboard, i) => dboard.isQuickView = i === idx);
    };

    menuSelected = (menu, event) => {
        if (event) {
            event.stopPropagation();
        }

        menu.selected = !menu.selected;

        if (menu.isHead) {
            this.selectSubMenus(menu);
        }

        const selectedMenu = this.menus.filter(m => m.selected && !m.isHead).map(m => m.id);
        this.setState({ selectedMenu }, this.saveSettings);
    };

    selectSubMenus(menu) {
        const { menus } = this;

        for (let i = menus.indexOf(menu) + 1; i < menus.length; i++) {
            const subMenu = menus[i];
            if (subMenu.isHead) {
                return;
            }
            subMenu.selected = menu.selected;
        }
    }

    menuTemplate = (menu) => {
        if (menu.isHead) {
            return <div onClick={($event) => this.menuSelected(menu, $event)}>
                <Checkbox checked={menu.selected} /><span>{menu.name}</span>
            </div>;
        }
        if (!menu.isHead) {
            return <div style={{ marginLeft: 20 }} onClick={(e) => this.menuSelected(menu, e)}>
                <Checkbox checked={menu.selected} /><span>{menu.name}</span>
            </div>;
        }
    };

    saveSettings = () => {
        const { menuAction } = this.state;
        const setting = { action: parseInt(menuAction) };
        const launchSetting = { action: setting.action };

        switch (menuAction) {
            case 1:
                launchSetting.menus = this.menus
                    .filter(menu => menu.selected && !menu.isHead)
                    .map(menu => ({ name: menu.name, url: menu.url }));
                setting.selectedMenu = this.state.selectedMenu;
                break;
            case 2:
                if (this.state.selectedLaunchPage) {
                    const selLPage = this.menus.first(menu => menu.id === this.state.selectedLaunchPage);
                    if (selLPage) {
                        launchSetting.url = selLPage.url;
                        setting.autoLaunch = this.state.selectedLaunchPage;
                    }
                }
                break;
            case 3:
                if (this.state.selectedDashboard) {
                    launchSetting.index = parseInt((this.state.selectedDashboard || '0').replace('D-', ''));
                    setting.quickIndex = this.state.selectedDashboard;
                }
                break;
            default: break;
        }

        this.$cache.set("menuAction", launchSetting, false, true);
        this.saveSetting(setting, 'launchAction');
    };

    render() {
        const {
            launchMenus, dashboardMenus, menus,
            state: { selectedDashboard, selectedLaunchPage, menuAction }
        } = this;

        return (
            <div>
                <p>This page allows you to set what is displayed when you click on JA icon in your browser</p>
                <div className="block">
                    <div className="ui-g ui-fluid">
                        <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>What should happen when clicking on JA icon?</strong>
                        </div>
                        <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group">
                                <RadioButton value={menuAction} onChange={this.menuActionSelected} defaultValue={1} label="Show menus" />
                                <RadioButton value={menuAction} onChange={this.menuActionSelected} defaultValue={2} label="Auto launch" />
                                <RadioButton value={menuAction} onChange={this.menuActionSelected} defaultValue={3} label="Show quickview dashboard" />
                                <span className="help-block">Select appropriate option what you would expect to happen when you click on JA icon</span>
                            </div>
                        </div>
                        {menuAction === 1 && <>
                            <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                                <strong>Menus to display</strong>
                            </div>
                            <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                                <div className="form-group">
                                    <ListBox options={menus} optionValue="id" optionLabel="id"
                                        multiple={true} style={{ width: '300px' }} listStyle={{ maxHeight: '250px' }}
                                        itemTemplate={this.menuTemplate} />
                                    <span className="help-block">Choose the list of menus you would like to be displayed</span>
                                </div>
                            </div>
                        </>}

                        {menuAction === 2 && <>
                            <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                                <strong>Auto launch page</strong>
                            </div>
                            <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                                <div className="form-group">
                                    <SelectBox dataset={launchMenus} value={selectedLaunchPage} onChange={this.launchPageChanged}
                                        valueField="value" style={{ 'width': '200px' }} group={true}>
                                        {(menu) => (<>
                                            <span className={`fa ${menu.icon}`} />
                                            <span style={{ marginLeft: "4px" }}>{menu.label}</span>
                                        </>)}
                                        {(group, i) => <strong key={i}>{group.label}</strong>}
                                    </SelectBox>
                                    <span className="help-block">Select the page to be launched when clicking on the JA icon</span>
                                </div>
                            </div>
                        </>}


                        {menuAction === 3 && <>
                            <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                                <strong>Quick view board</strong>
                            </div>
                            <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                                <div className="form-group">
                                    <SelectBox dataset={dashboardMenus} value={selectedDashboard} onChange={this.dashboardChanged}
                                        style={{ 'width': '200px' }} valueField="value">
                                        {(menu) => <>
                                            <i className={`fa ${menu.icon}`} />
                                            <span style={{ verticalAlign: 'middle' }}>{menu.label}</span>
                                        </>}
                                    </SelectBox>
                                </div>
                            </div>
                        </>}
                    </div>
                </div>
            </div>
        );
    }
}

export default MenuOptionsTab;