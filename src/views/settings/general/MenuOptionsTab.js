import React from 'react';
import TabControlBase from './TabControlBase';
import { navigation } from '../../../_nav';
import { Checkbox, SelectBox } from '../../../controls';

class MenuOptionsTab extends TabControlBase {
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
                                    <input type="radio" value={settings.menuAction} onChange={(val) => { settings.menuAction = val }} defaultValue={1} /> Show menus
                                        </label>
                                <label className="check">
                                    <input type="radio" value={settings.menuAction} onChange={(val) => { settings.menuAction = val }} defaultValue={2} /> Auto launch
                                        </label>
                                <label className="check">
                                    <input type="radio" value={settings.menuAction} onChange={(val) => { settings.menuAction = val }} defaultValue={3} /> Show quickview dashboard
                                        </label>
                                <span className="help-block">Select appropriate option what you would expect to happen when you click on JA icon</span>
                            </div>
                        </div>
                        <div hidden={settings.menuAction !== '1'} className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Menus to display</strong>
                        </div>
                        <div hidden={settings.menuAction !== '1'} className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group">
                                <div style={{ display: 'inline-block', height: 300, overflow: 'auto' }}>
                                    <p-listbox options={menus} value={selectedMenus} onChange={(val) => this.setState({ selectedMenus: val })} multiple="multiple" optionlabel="name" style={{ width: '300px', height: '300px' }}>
                                        {(menu) => (<>
                                            {menu.value.isHead && <div onClick={($event) => { menu.value.selected = !menu.value.selected; this.selectSubMenus(menu, $event) }}>
                                                <Checkbox value={menu.value.selected} onChange={(val) => { menu.value.selected = val }} label={menu.label}
                                                    binary="true" onClick={(e) => this.selectSubMenus(menu, e)} />
                                            </div>}
                                            {!menu.value.isHead && <div style={{ marginLeft: 20 }} onClick={() => menu.value.selected = !menu.value.selected}>
                                                <Checkbox value={menu.value.selected} onChange={(val) => { menu.value.selected = val }} label={menu.label} binary="true" onClick={(e) => e.stopPropagation} />
                                            </div>}</>)}
                                    </p-listbox></div>
                                <span className="help-block">Choose the list of menus you would like to be displayed</span>
                            </div>
                        </div>
                        <div hidden={settings.menuAction !== '2'} className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Auto launch page</strong>
                        </div>
                        <div hidden={settings.menuAction !== '2'} className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group">
                                <SelectBox options={launchMenus} value={selectedLaunchPage} onChange={(val) => this.setState({ selectedLaunchPage: val })} style={{ 'width': '200px' }} group={true}>
                                    {(menu) => (<>
                                        <i className="fa" ngclass={menu.icon} />
                                        <span style={{ verticalAlign: 'middle' }}>{menu.label}</span>
                                    </>)}
                                    {(group) => <>
                                        <div style={{ height: '200px' }}>
                                            <span style={{ verticalAlign: 'middle' }}>{group.label}</span>
                                        </div>
                                        <p />
                                        <span className="help-block">Select the page to be launched when clicking on the JA icon</span>
                                    </>}
                                </SelectBox>
                            </div>
                        </div>
                        <div hidden={settings.menuAction !== '3'} className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                            <strong>Quick view board</strong>
                        </div>
                        <div hidden={settings.menuAction !== '3'} className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                            <div className="form-group">
                                <SelectBox options={dashboards} value={selectedDashboard} onChange={(val) => this.setState({ selectedDashboard: val })} style={{ 'width': '200px' }}>
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