import { useState, useEffect, useRef, useCallback } from 'react';

import { inject } from '@services';

import { Dropdown } from '@components';

interface JiraField {
    id: string;
    key?: string;
    name: string;
    label: string;
    value: string;
    custom: boolean;
    schema?: { type: string; system?: string };
}

interface FieldGroup {
    label: string;
    items: JiraField[];
}

interface CustomFieldSelectorProps {
    onChange: (value: string, field: JiraField) => void;
}

function CustomFieldSelector({ onChange }: CustomFieldSelectorProps) {
    const [fields, setFields] = useState<FieldGroup[]>([]);
    const jiraFieldsRef = useRef<Record<string, JiraField>>({});
    const { $jira, $message } = inject('JiraService', 'MessageService');

    useEffect(() => {
        (async () => {
            try {
                const data: JiraField[] = await $jira.getCustomFields();
                const keyMap: Record<string, JiraField> = {};
                let basicFields: JiraField[] = [];
                let customFields: JiraField[] = [];

                for (const f of data) {
                    f.label = f.name + (f.name.toLowerCase() !== f.id.toLowerCase() ? ` (${f.id})` : '');
                    f.value = f.id;
                    keyMap[f.id] = f;

                    if (f.custom) {
                        customFields.push(f);
                    } else {
                        basicFields.push(f);
                    }
                }

                basicFields = basicFields.sort((a, b) => a.name.localeCompare(b.name));
                customFields = customFields.sort((a, b) => a.name.localeCompare(b.name));

                jiraFieldsRef.current = keyMap;
                setFields([
                    { label: 'Basic Fields', items: basicFields },
                    { label: 'Custom Fields', items: customFields },
                ]);
            } catch (err) {
                $message.error('Failed to load custom fields', 'Error');
            }
        })();
    }, [$jira, $message]);

    const displayFieldAdded = useCallback(
        (e: { value: string }) => {
            const val = e.value;
            if (!val) {
                return;
            }
            const field = jiraFieldsRef.current[val];
            if (!field) {
                return;
            }
            onChange(val, field);
        },
        [onChange],
    );

    const options = fields.flatMap((group) => [
        { label: group.label, value: `__group__${group.label}`, disabled: true },
        ...group.items.map((f) => ({ label: f.label, value: f.id })),
    ]);

    return (
        <Dropdown
            options={options}
            value=""
            onChange={displayFieldAdded}
            searchable
            placeholder="Choose a column to add to the list"
            className="w-full"
        />
    );
}

export default CustomFieldSelector;
