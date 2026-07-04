import { useState } from 'react';

import { inject } from '../services';

import AutoCompleteEditor from './AutoCompleteEditor';

interface IssueKeyEditorProps {
    value?: any;
    onChange: (result: any, modified: boolean) => void;
    placeholder?: string;
}

function IssueKeyEditor({ value, onChange, placeholder }: IssueKeyEditorProps) {
    const [items, setItems] = useState<any[]>([]);
    const $jira = inject('JiraService') as any;

    const search = async (qry: string) => {
        const issues = await $jira.searchIssueForPicker(qry, { currentJQL: '' });
        const searchItems = issues.map((t: any) => ({
            value: t.key,
            label: `${t.key} - ${t.summaryText}`,
            iconUrl: t.img,
        }));
        setItems(searchItems);
    };

    return (
        <AutoCompleteEditor
            value={value}
            onChange={onChange}
            placeholder={placeholder || 'Enter Jira Issue key'}
            items={items}
            onFilter={search}
        />
    );
}

export default IssueKeyEditor;
