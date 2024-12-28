import React, { PureComponent } from 'react';
import { Button } from '../../controls';
import TextBox from '../../controls/TextBox';
import { OverlayPanel } from 'primereact/overlaypanel';
import { DASHBOARD_ICONS } from '../../constants/font-icons';
import './DashboardName.scss';

class DashboardName extends PureComponent {
    constructor(props) {
        super(props);
        this.state = this.getState(props);
    }

    UNSAFE_componentWillReceiveProps(newProps) {
        this.setState(this.getState(newProps));
    }

    getState(props) {
        let { value, icon } = props;
        if (!icon) { icon = "fa-tachometer"; }
        if (!value) { value = "Default"; }
        return { value, icon };
    }

    saveName = () => {
        this.setState({ isEditMode: false });
        const { value, icon } = this.state;
        this.props.onChange(value, icon);
    };

    onChange = (value) => this.setState({ value });
    onIconChange = (icon) => this.setState({ icon });

    cancelEdit = () => this.setState({ isEditMode: false, value: this.props.value, icon: this.props.icon });

    showIcons = (e) => this.op.show(e);
    setRef = (el) => this.op = el;

    render() {
        const { value, icon, isEditMode } = this.state;

        if (isEditMode) {
            return <>
                <div className="p-inputgroup dashboard-name-edit">
                    <Button icon={`fa ${icon}`} onClick={this.showIcons} />
                    <TextBox value={value} maxLength={18} onChange={this.onChange} />
                    <Button icon="fa fa-check" type="success" onClick={this.saveName} disabled={!value || value.length <= 2} />
                    <Button icon="fa fa-undo" onClick={this.cancelEdit} />
                </div>

                <OverlayPanel ref={this.setRef}>
                    <div className="dashboard-icons">
                        {DASHBOARD_ICONS.map((icon, i) => <div key={i} className="d-icon" onClick={() => this.onIconChange(icon)}><span className={icon} /></div>)}
                        <div className="clear-fix" />
                    </div>
                </OverlayPanel>
            </>;
        } else {
            return (
                <div className="dashboard-name" title="Click to edit the name or change the icon" onClick={() => this.setState({ isEditMode: true })}>
                    <span className={`board-icon fa ${icon}`} />
                    <span className="lev-1">Dashboards</span>
                    <i className="fa fa-arrow-right"></i>
                    <span className="lev-2">{value}</span>
                    <i className="fa fa-edit"></i>
                </div>
            );
        }
    }
}

export default DashboardName;