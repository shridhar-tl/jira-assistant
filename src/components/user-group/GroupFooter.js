import React, { PureComponent } from 'react';
import { TextBox, Button, Checkbox, AutoComplete } from '../../controls';
import { inject } from '../../services';

class GroupFooter extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "JiraService");
        this.state = {};
    }

    addNewGroup = () => {
        if (this.props.addNewGroup(this.state.groupName, this.state.isJiraGroup && this.state.groupId)) {
            this.endAdd();
        }
    };

    setGroupName = (groupName) => this.setState({ groupName });

    setAddMode = (editMode) => this.setState({ editMode, groupName: '' });
    beginAdd = () => this.setAddMode(true);
    endAdd = () => this.setAddMode(false);

    toggleJiraGroup = (isJiraGroup) => this.setState({ isJiraGroup, groupId: null, groupName: '' });
    searchGroups = (query) => this.$jira.searchGroups(query);
    groupSelected = (group) => {
        const { groupId, name } = group || {};
        if (!groupId) { return; }
        this.setState({ groupId, groupName: name });
    };

    render() {
        const {
            endAdd, addNewGroup, setGroupName, toggleJiraGroup,
            props: { isPlugged, saveGroups, onDone },
            state: { editMode, groupName, isJiraGroup }
        } = this;

        return (
            <tfoot>
                <tr>
                    <td colSpan={6}>
                        <div style={{ height: 30, paddingTop: 4 }}>
                            <div className="pull-left">
                                <div className="ui-inputgroup" hidden={editMode}>
                                    <Button type="success" icon="fa fa-plus" label="Add group" onClick={this.beginAdd} />
                                </div>
                                <div className="ui-inputgroup" hidden={!editMode}>

                                    <Checkbox checked={isJiraGroup} onChange={toggleJiraGroup} label="Add Jira Group" />
                                    {isJiraGroup ?
                                        <AutoComplete value={groupName} onChange={this.groupSelected}
                                            displayField="name" multiple={false} minLength={2} forceselection={true}
                                            placeholder="Select Jira Group"
                                            dataset={this.searchGroups} style={{ 'width': '185px' }} />
                                        : <TextBox value={groupName} onChange={setGroupName} maxLength={40} placeholder="Name of new group"
                                            onKey_Enter={addNewGroup} />}

                                    <Button type="success" icon="fa fa-check" disabled={!groupName} onClick={addNewGroup} />
                                    <Button type="danger" icon="fa fa-close" onClick={endAdd} />
                                </div>
                            </div>
                            <div className="pull-right">
                                {isPlugged && <span>Note: To permanently save the changes, go to Settings -&gt; User groups from menu.</span>}
                                {!isPlugged && <Button type="success" icon="fa fa-save" label="Save Changes" onClick={saveGroups} />}
                                {isPlugged && <Button icon="fa fa-save" label="Done" onClick={onDone} />}
                            </div>
                        </div>
                    </td>
                </tr>
            </tfoot >
        );
    }
}

export default GroupFooter;