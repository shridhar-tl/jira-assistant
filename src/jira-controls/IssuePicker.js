import React from 'react';
import { AutoComplete, Image } from '../controls';
import { inject } from '../services/injector-service';

export const IssuePicker = React.memo(function ({ className, value, placeholder, disabled, onChange }) {
    const { $jira: { lookupIssues } } = inject('JiraService');

    async function filterIssues(query) {
        const result = await lookupIssues(query);
        console.log(result);
        return result;
    }

    return (<AutoComplete value={value} displayField="value" className={className}
        placeholder={placeholder} forceSelection={true}
        dataset={filterIssues} disabled={disabled} maxLength={20}
        onChange={onChange} autoFocus optionGroupChildren="issues" optionGroupLabel="label">
        {(issue) => <span style={{ fontSize: 12, margin: '10px 10px 0 0' }}>
            <Image src={issue.img} alt="" />{issue.key} - {issue.summaryText}</span>}
    </AutoComplete>);
});