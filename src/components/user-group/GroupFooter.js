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
            props: { isPlugged, saveGroups, onDone, onReset },
            state: { editMode, groupName, isJiraGroup }
        } = this;

        return (
            <tfoot>
                <tr>
                    <td colSpan={6}>
                        <div style={{ height: 30, paddingTop: 4 }}>
                            <div className="float-start">
                                <div className="ui-inputgroup" hidden={editMode}>
                                    <Button text type="success" icon="fa fa-plus" label="Add group" onClick={this.beginAdd} />
                                    {isPlugged && <span className="link margin-l-5 pad-b-5 inline-block" onClick={onReset}
                                        title="Click to clear local changes and pull data from user groups">Reset local changes</span>}
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

                                    <Button text type="success" icon="fa fa-check" disabled={!groupName} onClick={addNewGroup} />
                                    <Button text type="danger" icon="fa fa-close" onClick={endAdd} />
                                </div>
                            </div>
                            <div className="float-end">
                                {isPlugged && <span className="margin-r-8"><strong>Note:</strong> To permanently save the changes, go to Settings -&gt; User groups from menu.</span>}
                                {!isPlugged && <Button type="primary" icon="fa fa-save" label="Save Changes" onClick={saveGroups} />}
                                {isPlugged && <Button type="primary" icon="fa fa-save" label="Apply for now (not saved)" onClick={onDone} />}
                            </div>
                        </div>
                    </td>
                </tr>
            </tfoot >
        );
    }
}

export default GroupFooter;