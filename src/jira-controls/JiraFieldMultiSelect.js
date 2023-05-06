import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { inject } from '../services';
import { SelectBox } from '../controls';

function JiraFieldMultiSelect({ value, field, valueOnly, onChange, hideTypes, hideKeys }) {
    const valueToPass = useMemo(() => {
        if (!value || valueOnly) {
            return value;
        } else {
            return value.map(v => v.key);
        }
    }, [value, valueOnly]);

    const [fields, setFields] = useState();
    const fieldsMap = useMemo(() => fields?.reduce((obj, f) => {
        obj[f.key] = f;
        return obj;
    }, {}), [fields]);

    useEffect(() => {
        getCustomFields(hideTypes, hideKeys).then(setFields);
    }, [hideTypes, hideKeys]);

    const changeHandler = useCallback((value, field) => {
        const selValue = value.map(v => {
            const f = fieldsMap[v];
            const { key, name } = f;
            const type = getFieldType(f);

            return { key, name, type };
        });

        onChange(selValue, field);
    }, [fieldsMap, onChange]);

    if (!fields) {
        return 'Loading...';
    }

    return (<SelectBox
        multiselect valueField="key" displayField="name"
        value={valueToPass || []} dataset={fields || []}
        field={field} onChange={valueOnly ? onChange : changeHandler}
        filter placeholder="Choose the list of columns" />);
}

export default JiraFieldMultiSelect;

async function getCustomFields(hideTypes, hideKeys) {
    const { $jira } = inject('JiraService');
    let fields = await $jira.getCustomFields();

    if (Array.isArray(hideTypes) && hideTypes.length) {
        fields = fields.filter(f => !hideTypes.includes(f.schema?.type));
    }

    if (Array.isArray(hideKeys) && hideKeys.length) {
        fields = fields.filter(f => !hideKeys.includes(f.key));
    }

    return fields;
}

function getFieldType(f) {
    const { schema, key } = f;

    if (!schema) {
        return key;
    }

    const { type, system } = schema;

    if (!system) {
        return type;
    }

    if (type === 'number' && (system.endsWith('timespent') || system.endsWith('estimate'))) {
        return 'timespent';
    }
    // Handle array of user,version,issuelinks,component,votes, and so on

    return type;
}