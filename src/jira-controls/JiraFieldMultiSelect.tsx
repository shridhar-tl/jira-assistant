import { useCallback, useEffect, useMemo, useState } from 'react';

import { inject } from '@services';

import { Multiselect } from '@components';

interface JiraFieldSchema {
    type: string;
    system?: string;
}

interface JiraField {
    id: string;
    key?: string;
    name: string;
    custom?: boolean;
    schema?: JiraFieldSchema;
}

interface SelectedField {
    id: string;
    key: string;
    name: string;
    type: string;
}

interface JiraFieldMultiSelectBaseProps {
    value?: string[] | SelectedField[];
    valueOnly?: boolean;
    hideTypes?: string[];
    hideKeys?: string[];
}

interface JiraFieldMultiSelectWithField extends JiraFieldMultiSelectBaseProps {
    field: string;
    onChange: (value: string[] | SelectedField[], field: string) => void;
}

interface JiraFieldMultiSelectWithoutField extends JiraFieldMultiSelectBaseProps {
    field?: undefined;
    onChange: (value: string[] | SelectedField[], field?: undefined) => void;
}

type JiraFieldMultiSelectProps = JiraFieldMultiSelectWithField | JiraFieldMultiSelectWithoutField;

async function getCustomFields(hideTypes?: string[], hideKeys?: string[]): Promise<JiraField[]> {
    const { $jira } = inject('JiraService');
    let fields: JiraField[] = await $jira.getCustomFields();

    if (Array.isArray(hideTypes) && hideTypes.length) {
        fields = fields.filter((f) => !hideTypes.includes(f.schema?.type ?? ''));
    }

    if (Array.isArray(hideKeys) && hideKeys.length) {
        fields = fields.filter((f) => !hideKeys.includes(f.id));
    }

    return fields;
}

function getFieldType(f: JiraField): string {
    const { schema, key } = f;

    if (!schema) {
        return key || f.id;
    }

    const { type, system } = schema;

    if (!system) {
        return type;
    }

    if (type === 'number' && (system.endsWith('timespent') || system.endsWith('estimate'))) {
        return 'timespent';
    }

    return type;
}

function JiraFieldMultiSelect({ value, field, valueOnly, onChange: _onChange, hideTypes, hideKeys }: JiraFieldMultiSelectProps) {
    const onChange = _onChange as (value: string[] | SelectedField[], field?: string) => void;
    const [fields, setFields] = useState<JiraField[]>();

    const valueToPass = useMemo(() => {
        if (!value || valueOnly) {
            return value as string[] | undefined;
        }
        return (value as SelectedField[]).map((v) => v.id || v.key);
    }, [value, valueOnly]);

    const fieldsMap = useMemo(
        () =>
            fields?.reduce<Record<string, JiraField>>((obj, f) => {
                obj[f.id] = f;
                return obj;
            }, {}),
        [fields],
    );

    useEffect(() => {
        getCustomFields(hideTypes, hideKeys).then(setFields);
    }, [hideTypes, hideKeys]);

    const changeHandler = useCallback(
        (e: { value: string[] }) => {
            const selectedIds = e.value;
            const selValue: SelectedField[] = selectedIds.map((v) => {
                const f = fieldsMap![v];
                const { id, key = id, name } = f;
                const type = getFieldType(f);
                return { id, key, name, type };
            });
            onChange(selValue, field);
        },
        [fieldsMap, onChange, field],
    );

    if (!fields) {
        return <span>Loading...</span>;
    }

    const options = fields.map((f) => ({ label: f.name, value: f.id }));

    return (
        <Multiselect
            value={valueToPass || []}
            options={options}
            onChange={valueOnly ? (e: { value: string[] }) => onChange(e.value, field) : changeHandler}
            searchable
            placeholder="Choose the list of columns"
            className="w-full"
        />
    );
}

export default JiraFieldMultiSelect;
