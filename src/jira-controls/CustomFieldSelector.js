import React, { PureComponent } from 'react';
import { SelectBox } from '../controls';
import { inject } from '../services/injector-service';

class CustomFieldSelector extends PureComponent {
    constructor() {
        super();
        inject(this, "JiraService", "MessageService", "AnalyticsService");
        this.state = { fields: [] };
        this.loadCustomFields();
    }

    async loadCustomFields() {
        const data = await this.$jira.getCustomFields();

        const keyMap = {};
        this.jiraFields = keyMap;
        //const favoriteFilters = ['key', 'assignee', 'created', 'creator', 'issue type', 'labels', 'project', 'reporter', 'resolution', 'resolved', 'status', 'summary', 'updated', 'sprint'];
        let basicFields = [], customFields = [];

        for (const f of data) {
            f.label = f.name + (f.name.toLowerCase() !== f.id.toLowerCase() ? ` (${f.id})` : '');
            f.value = f.id;
            keyMap[f.id] = f;

            if (f.custom) {
                customFields.push(f);
            }
            else {
                basicFields.push(f);
            }
        }

        basicFields = basicFields.orderBy((f) => f.name);
        customFields = customFields.orderBy((f) => f.name);

        this.setState({
            fields: [
                { label: 'Basic Fields', items: basicFields },
                { label: 'Custom Fields', items: customFields }
            ]
        });
    }

    displayFieldAdded = (val) => {
        if (!val || val.items) { // Return if a group is selected instead of items
            return;
        }

        this.props.onChange(val, this.jiraFields[val]);
    };

    render() {
        const { fields } = this.state;

        return (
            <SelectBox dataset={fields} value="" style={{ 'width': '100%' }}
                placeholder="Choose a column to add to the list"
                group={true} displayField="name" valueField="id" dataKey="id"
                filterPlaceholder="Type the field name to filter"
                onChange={this.displayFieldAdded}>
                {(itm) => <span>{itm.name}</span>}
                {(grp) => <strong>{grp.label}</strong>}
            </SelectBox>
        );
    }
}

export default CustomFieldSelector;