import React, { PureComponent } from 'react';
import Button from '../../controls/Button';
import TextBox from '../../controls/TextBox';
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
    }

    onChange = (value) => this.setState({ value })

    cancelEdit = () => this.setState({ isEditMode: false, value: this.props.value })

    render() {
        const { value, icon, isEditMode } = this.state;

        if (isEditMode) {
            return (
                <div className="p-inputgroup dashboard-name-edit">
                    <Button icon={`fa ${icon}`} />
                    <TextBox value={value} maxLength={18} onChange={this.onChange} />
                    <Button icon="fa fa-check" type="success" onClick={this.saveName} disabled={!value || value.length <= 2} />
                    <Button icon="fa fa-undo" onClick={this.cancelEdit} />
                </div>
            );
        } else {
            return (
                <div className="dashboard-name" title="Click to edit the name or change the icon" onClick={() => this.setState({ isEditMode: true })}>
                    <i className={`board-icon fa ${icon}`}></i>
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