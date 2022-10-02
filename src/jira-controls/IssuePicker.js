import React from 'react';
import { AutoComplete, Image } from '../controls';
import { inject } from '../services/injector-service';

export const IssuePicker = React.memo(function ({ className, value, placeholder, disabled, onChange, onSelect }) {
    const { $jira: { lookupIssues } } = inject('JiraService');

    return (<AutoComplete value={value} displayField="value" className={className}
        placeholder={placeholder} forceSelection={true}
        dataset={lookupIssues} disabled={disabled} maxLength={20}
        onChange={onChange} onSelect={onSelect} autoFocus optionGroupChildren="issues" optionGroupLabel="label">
        {(issue) => <span style={{ fontSize: 12, margin: '10px 10px 0 0' }}>
            <Image src={issue.img} alt="" />{issue.key} - {issue.summaryText}</span>}
    </AutoComplete>);
});