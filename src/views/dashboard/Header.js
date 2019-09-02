import React, { PureComponent } from 'react';
import Button from '../../controls/Button';
import DashboardName from './DashboardName';
import { inject } from '../../services/injector-service';
import { showContextMenu } from "../../controls/ContextMenu";

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
            { label: "Create dashboard", icon: "fa fa-plus", command: () => this.$dashboard.createDashboard() },
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

    deleteDashboard() {
        this.$dashboard.deleteDashboard(this.state.index).then(uid => {
            this.props.history.push(`/${this.props.userId}/dashboard/1`);
        });
    }

    setAsQuickView(quickViewLink) {
        quickViewLink.disabled = true;
        quickViewLink.icon = 'fa fa-check-square';
        this.$dashboard.setAsQuickView(this.state.config, this.state.index);
    }

    setAsTabView(tabViewLink) {
        const { config, index } = this.state;

        this.$dashboard.setAsTabView(config, index);

        tabViewLink.icon = config.isQuickView ? "fa fa-check-square" : "fa fa-square";
        this.props.tabViewChanged(config.isTabView);
    }

    nameChanged = (name, icon) => {
        const { index, config } = this.state;
        config.name = name;
        config.icon = icon;
        this.$dashboard.saveDashboardInfo(index, config, true);
    }

    render() {
        const { config: { icon, name } } = this.state;

        return (
            <>
                <div className="page-header">
                    <div className="pull-left"><DashboardName icon={icon} value={name} onChange={this.nameChanged} /></div>
                    <div className="pull-right">
                        <Button type="success" icon="fa fa-cubes" label="Add gadgets" onClick={this.props.onShowGadgets} />
                        <Button icon="fa fa-wrench" onClick={(e) => showContextMenu(e, this.contextMenu)} />
                    </div>
                </div>
            </>
        );
    }
}

export default Header;