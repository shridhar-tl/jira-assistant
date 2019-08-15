import React from 'react';
import TabControlBase from './TabControlBase';
import { navigation } from '../../../_nav';
import { Checkbox, SelectBox, RadioButton } from '../../../controls';
import { ListBox } from 'primereact/listbox';

class MenuOptionsTab extends TabControlBase {
    state = { launchMenus: [] };

    UNSAFE_componentWillMount() {
        var menus = [];
        var launchMenus = [];
        let lastGroup = null;
        var launchAct = this.props.settings.launchAction;
        var selMenus = launchAct.selectedMenu || ['D-0', 'R-UD', 'R-SP', 'R-CG', 'CAL', 'S-GE'];

        navigation.forEach(menu => {
            if (menu.name) {
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
        this.setState({
            menus, launchMenus, dashboards: launchMenus[0].items,
            selectedLaunchPage: launchAct.autoLaunch, selectedDashboard: launchAct.quickIndex
        });
    }

    setLaunchAction() {
        const { settings } = this.props;
        var setting = { action: parseInt(settings.menuAction) };
        var launchSetting = { action: setting.action };
        settings.launchAction = setting;
        switch (settings.menuAction) {
            case 1:
                launchSetting.menus = this.menus.filter(menu => menu.selected && !menu.isHead).map(menu => {
                    return { name: menu.name, url: menu.url };
                });
                break;
            case 2:
                if (this.selectedLaunchPage) {
                    var selLPage = this.menus.first(menu => menu.id === this.selectedLaunchPage);
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

        this.$cache.set("menuAction", launchSetting, false, true);
    }

    menuSelected = (menu, event) => {
        if (event) {
            event.stopPropagation();
        }

        menu.selected = !menu.selected;

        if (menu.isHead) {
            this.selectSubMenus(menu);
        }

        const selectedMenus = this.state.menus.filter(m => m.selected && !m.isHead).map(m => m.id);
        this.setValue("selectedMenus", selectedMenus);
    }

    selectSubMenus(menu) {
        const { menus } = this.state;

        for (var i = menus.indexOf(menu) + 1; i < menus.length; i++) {
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
            </div>
        }
        if (!menu.isHead) {
            return <div style={{ marginLeft: 20 }} onClick={(e) => this.menuSelected(menu, e)}>
                <Checkbox checked={menu.selected} /><span>{menu.name}</span>
            </div>
        }
    }

    dashboardChanged = (val) => this.setState({ selectedDashboard: val })
    launchPageChanged = (val) => this.setState({ selectedLaunchPage: val })

    render() {
        var {
            props: { settings },
            state: { selectedMenus, launchMenus, dashboards, menus, selectedDashboard, selectedLaunchPage }
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
                                <label className="check">
                                    <RadioButton value={settings.menuAction} onChange={(val) => this.setValue("menuAction", val)} defaultValue={1} /> Show menus
                                        </label>
                                <label className="check">
                                    <RadioButton value={settings.menuAction} onChange={(val) => this.setValue("menuAction", val)} defaultValue={2} /> Auto launch
                                        </label>
                                <label className="check">
                                    <RadioButton value={settings.menuAction} onChange={(val) => this.setValue("menuAction", val)} defaultValue={3} /> Show quickview dashboard
                                        </label>
                                <span className="help-block">Select appropriate option what you would expect to happen when you click on JA icon</span>
                            </div>
                        </div>

                        {settings.menuAction === 1 && <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Menus to display</strong>
                        </div>}
                        {settings.menuAction === 1 && <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group">
                                <div style={{ display: 'inline-block', height: 300, overflow: 'auto' }}>
                                    <ListBox options={menus} value={selectedMenus} onChange={(val) => this.setState({ selectedMenus: val })}
                                        multiple={true} style={{ width: '300px' }} listStyle={{ maxHeight: '250px' }} itemTemplate={this.menuTemplate} />
                                </div>
                                <span className="help-block">Choose the list of menus you would like to be displayed</span>
                            </div>
                        </div>}

                        <div hidden={settings.menuAction !== 2} className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Auto launch page</strong>
                        </div>
                        <div hidden={settings.menuAction !== 2} className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group">
                                <SelectBox options={launchMenus} value={selectedLaunchPage} onChange={this.launchPageChanged} style={{ 'width': '200px' }} group={true}>
                                    {(menu) => (<>
                                        <i className="fa" ngclass={menu.icon} />
                                        <span style={{ verticalAlign: 'middle' }}>{menu.label}</span>
                                    </>)}
                                    {(group) => <div style={{ height: '200px' }}>
                                        <span style={{ verticalAlign: 'middle' }}>{group.label}</span>
                                    </div>}
                                </SelectBox>
                                <span className="help-block">Select the page to be launched when clicking on the JA icon</span>
                            </div>
                        </div>

                        <div hidden={settings.menuAction !== 3} className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Quick view board</strong>
                        </div>
                        <div hidden={settings.menuAction !== 3} className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group">
                                <SelectBox options={dashboards} value={selectedDashboard} onChange={this.dashboardChanged}
                                    style={{ 'width': '200px' }}>
                                    {(menu) => <>
                                        <i className="fa" ngclass={menu.icon} />
                                        <span style={{ verticalAlign: 'middle' }}>{menu.label}</span>
                                    </>}
                                </SelectBox>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default MenuOptionsTab;