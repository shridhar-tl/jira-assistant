import React from 'react';
import BaseDialog from './BaseDialog';
import UserGroup from '../components/user-group/UserGroup';

class GroupEditor extends BaseDialog {
    constructor(props) {
        super(props, "Add users");
        this.style = { width: '90vw' };
        this.className = "no-padding";
    }

    render() {
        return super.renderBase(
            <UserGroup isPlugged={true} groups={this.props.groups} onDone={this.onHide} />
        );
    }
}

export default GroupEditor;