import React from 'react';
import TabControlBase from './TabControlBase';
import { Checkbox, SelectBox, RadioButton } from '../../../controls';
import { ListBox } from 'primereact/listbox';

class MenuOptionsTab extends TabControlBase {
    constructor(props) {
        super(props);
        this.state = { launchMenus: [] };
    }

    UNSAFE_componentWillMount() {
        const launchAct = this.props.settings.launchAction;

        this.setState({
            selectedLaunchPage: launchAct.autoLaunch, selectedDashboard: launchAct.quickIndex
        });
    }

    menuSelected = (menu, event) => {
        if (event) {
            event.stopPropagation();
        }

        menu.selected = !menu.selected;

        if (menu.isHead) {
            this.selectSubMenus(menu);
        }

        const selectedMenus = this.props.menus.filter(m => m.selected && !m.isHead).map(m => m.id);
        this.props.menusChanged(selectedMenus);
        this.setState({ selectedMenus });
    }

    selectSubMenus(menu) {
        const { menus } = this.props;

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
    }

    menuActionSelected = (action) => {
        this.setValue("menuAction", action);
    }

    launchPageChanged = (val) => {
        this.setState({ selectedLaunchPage: val });
        this.props.launchPageChanged(val);
    }

    dashboardChanged = (val) => {
        this.setState({ selectedDashboard: val });
        this.props.dashboardChanged(val);
    }

    render() {
        const {
            props: { launchMenus, dashboards, menus, settings },
            state: { selectedMenus, selectedDashboard, selectedLaunchPage }
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
                                <RadioButton value={settings.menuAction} onChange={this.menuActionSelected} defaultValue={1} label="Show menus" />
                                <RadioButton value={settings.menuAction} onChange={this.menuActionSelected} defaultValue={2} label="Auto launch" />
                                <RadioButton value={settings.menuAction} onChange={this.menuActionSelected} defaultValue={3} label="Show quickview dashboard" />
                                <span className="help-block">Select appropriate option what you would expect to happen when you click on JA icon</span>
                            </div>
                        </div>
                        {settings.menuAction === 1 && <>
                            <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                                <strong>Menus to display</strong>
                            </div>
                            <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                                <div className="form-group">
                                    <ListBox options={menus} value={selectedMenus} onChange={(val) => this.setState({ selectedMenus: val })}
                                        multiple={true} style={{ width: '300px' }} listStyle={{ maxHeight: '250px' }} itemTemplate={this.menuTemplate} />
                                    <span className="help-block">Choose the list of menus you would like to be displayed</span>
                                </div>
                            </div>
                        </>}

                        {settings.menuAction === 2 && <>
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


                        {settings.menuAction === 3 && <>
                            <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                                <strong>Quick view board</strong>
                            </div>
                            <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                                <div className="form-group">
                                    <SelectBox dataset={dashboards} value={selectedDashboard} onChange={this.dashboardChanged}
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