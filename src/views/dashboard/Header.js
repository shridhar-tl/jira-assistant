import React, { PureComponent } from 'react';
import Button from '../../controls/Button';
import DashboardName from './DashboardName';
import { inject } from '../../services/injector-service';
import { showContextMenu } from "jsd-report";

class Header extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "DashboardService");
        this.state = this.getStateDetails(props);
    }

    UNSAFE_componentWillReceiveProps(newProps) {
        this.setState(this.getStateDetails(newProps));
    }

    getStateDetails(props) {
        const { config, index } = props;

        const contextMenu = [
            { label: "Create dashboard", icon: "fa fa-plus", command: () => this.$dashboard.createDashboard(this.state.config) },
            { label: "Delete dashboard", icon: "fa fa-trash-o", command: () => this.deleteDashboard(), disabled: index === 0 }
        ];

        if (!this.props.isQuickView) {
            const tabViewLink = {
                label: "Show in tabs", icon: config.isTabView ? "fa fa-check-square" : "fa fa-square",
                command: () => this.setAsTabView(tabViewLink)
            };

            const quickViewLink = {
                label: "Set as quick view", icon: config.isQuickView ? "fa fa-check-square" : "fa fa-square",
                disabled: config.isQuickView, command: () => this.setAsQuickView(quickViewLink)
            };

            contextMenu.push(tabViewLink);
            contextMenu.push(quickViewLink);
        }

        this.contextMenu = contextMenu;

        return { config, index };
    }

    async deleteDashboard() {
        await this.$dashboard.deleteDashboard(this.state.index);
        this.props.history.push(`/${this.props.userId}/dashboard/0`);
    }

    async setAsQuickView(quickViewLink) {
        quickViewLink.disabled = true;
        quickViewLink.icon = 'fa fa-check-square';
        this.contextMenu = [...this.contextMenu];

        const config = await this.$dashboard.setAsQuickView(this.state.config, this.state.index);
        this.setState({ config });
    }

    async setAsTabView(tabViewLink) {
        const { config, index } = this.state;

        const curBoard = await this.$dashboard.setAsTabView(config, index);

        tabViewLink.icon = curBoard.isTabView ? "fa fa-check-square" : "fa fa-square";
        this.contextMenu = [...this.contextMenu];

        this.setState({ config: curBoard });
        this.props.tabViewChanged(curBoard.isTabView);
    }

    nameChanged = (name, icon) => {
        const { index, config } = this.state;
        config.name = name;
        config.icon = icon;
        this.$dashboard.saveDashboardInfo(index, config, true);
    };

    showContext = (e) => showContextMenu(e, this.contextMenu);

    render() {
        const { config: { icon, name } } = this.state;

        return (
            <div className="page-header">
                <div className="pull-left"><DashboardName icon={icon} value={name} onChange={this.nameChanged} /></div>
                <div className="pull-right">
                    <Button type="success" icon="fa fa-cubes" label="Add gadgets" onClick={this.props.onShowGadgets} />
                    <Button icon="fa fa-wrench" onClick={this.showContext} />
                </div>
            </div>
        );
    }
}

export default Header;