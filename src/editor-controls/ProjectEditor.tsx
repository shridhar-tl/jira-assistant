import { useEffect, useState } from 'react';

import { inject } from '../services';

import AutoCompleteEditor from './AutoCompleteEditor';

interface ProjectEditorProps {
    value?: any;
    onChange: (result: any, modified: boolean) => void;
    placeholder?: string;
}

function ProjectEditor({ value, onChange, placeholder }: ProjectEditorProps) {
    const [projects, setProjects] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const $jira = inject('JiraService') as any;

    useEffect(() => {
        const loadProjects = async () => {
            const projectsList = await $jira.getAllProjects();
            setProjects(projectsList);
        };
        loadProjects();
    }, [$jira]);

    const search = async (qry: string) => {
        const filtered = projects.filter(
            (p: any) => p.name?.toLowerCase().includes(qry.toLowerCase()) || p.key?.toLowerCase().includes(qry.toLowerCase()),
        );

        const searchItems = filtered.map((p: any) => ({
            value: p.key,
            label: `${p.name} (${p.key})`,
            iconUrl: p.avatarUrls?.['16x16'],
        }));
        setItems(searchItems);
    };

    return (
        <AutoCompleteEditor
            value={value}
            onChange={onChange}
            placeholder={placeholder || 'Select project'}
            items={items}
            onFilter={search}
        />
    );
}

export default ProjectEditor;
