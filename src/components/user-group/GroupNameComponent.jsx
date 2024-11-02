import React, { PureComponent } from 'react';
import { TextBox, Button } from '../../controls';
import { inject } from '../../services';

class GroupNameComponent extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "MessageService");
        this.state = { editMode: false };
    }

    setEditMode = (editMode) => this.setState({ editMode, groupName: this.props.group.name });
    beginEdit = () => this.setEditMode(true);
    endEdit = () => this.setEditMode(false);

    setGroupName = (groupName) => this.setState({ groupName });

    updateGroupName = () => {
        const {
            props: { group, hasGroupWithName }
        } = this;

        let { groupName } = this.state;

        groupName = groupName.trim();
        if (hasGroupWithName(groupName, group)) {
            this.$message.warning(`The group with the name '${groupName}' already exists!`, "Group already exists");
            return;
        }

        this.props.group.name = groupName;
        this.endEdit();
    };

    render() {
        const {
            endEdit, setGroupName, updateGroupName,
            state: { editMode, groupName },
            props: { group }
        } = this;

        let { beginEdit } = this;
        if (group.isJiraGroup) {
            beginEdit = undefined;
        }

        if (!editMode) {
            return <div onClick={beginEdit}>
                <span style={{ fontWeight: 600, fontSize: 17 }}>{group.name} </span>
                ({group.users.length} users) {!group.isJiraGroup && <i className="fa fa-edit" />}
            </div>;
        }
        else {
            return <div className="ui-inputgroup">
                <TextBox value={groupName} maxLength={40} onChange={setGroupName} />
                <Button type="success" icon="fa fa-check" onClick={updateGroupName} />
                <Button type="danger" icon="fa fa-undo" onClick={endEdit} />
            </div>;
        }
    }
}

export default GroupNameComponent;