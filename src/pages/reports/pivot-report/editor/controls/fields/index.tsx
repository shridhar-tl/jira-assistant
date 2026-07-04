import { useEffect, useState } from 'react';

import { stop } from '@/utils';

import type { ComponentEvent } from '@components';
import { TextInput } from '@components';

import { Draggable } from '@controls';

import { useFieldFilterText } from '../../../store/pivot-config';
import type { JiraField } from '../../../types';
import { fillFieldsList, useFieldsList } from '../../../utils/fields';

export default function FieldsCollection() {
    const fields = useFieldsList(({ fields }) => fields);

    useEffect(() => {
        fillFieldsList();
    }, []);

    return (
        <div className="flex flex-col h-full min-h-0">
            <SearchBox />
            <div className="flex-1 overflow-y-auto min-h-0">
                {fields.map((f) => (
                    <FieldsList key={f.label} fields={f.items} title={f.label} />
                ))}
            </div>
        </div>
    );
}

function SearchBox() {
    const { searchText, setSearchText } = useFieldFilterText();

    return (
        <div className="p-3 border-b border-[--border-primary] relative">
            <TextInput
                value={searchText}
                placeholder="type here to search for fields..."
                onChange={(e: ComponentEvent<string>) => setSearchText(e.value)}
                className="pl-8"
            />
            <span className="fa fa-search absolute right-6 top-1/2 -translate-y-1/2 text-[--text-tertiary]" />
        </div>
    );
}

interface FieldsListProps {
    fields: JiraField[];
    title: string;
}

function FieldsList({ fields, title }: FieldsListProps) {
    const searchText = useFieldFilterText(({ searchText }) => searchText)
        ?.trim()
        ?.toLowerCase();
    const [items, setItems] = useState(() => getFilteredFields(fields, searchText));

    useEffect(() => {
        setItems(getFilteredFields(fields, searchText));
    }, [searchText, fields]);

    if (!items?.length) {
        return null;
    }

    return (
        <div className="p-3 border-b border-[--border-primary]">
            <div className="font-semibold text-sm mb-2">{title}</div>
            <div className="space-y-1">
                {items.map((field, i) => (
                    <Draggable key={i} containerId="jira-fields" index={i} className="jira-field" itemType="jira-field" item={field}>
                        <div className="flex items-center justify-between p-2 rounded hover:bg-[--bg-secondary] cursor-move transition-colors border border-transparent hover:border-[--border-primary]">
                            <span className="text-sm">{field.name}</span>
                            <button
                                className="text-[--text-tertiary] hover:text-[--text-primary] transition-colors"
                                onClick={(e) => copyForFilter(e, field)}
                                title="Click to copy field for query filter"
                            >
                                <span className="fa fa-copy" />
                            </button>
                        </div>
                    </Draggable>
                ))}
            </div>
        </div>
    );
}

function getFilteredFields(fields: JiraField[], searchText?: string) {
    if (!searchText) {
        return fields;
    }

    return fields.filter((f) => f.name.toLowerCase().includes(searchText) || f.key.toLowerCase().includes(searchText));
}

function copyForFilter(e: React.MouseEvent, field: JiraField) {
    stop(e);
    let value = field.custom ? field.name : field.key;

    if (value.includes(' ')) {
        value = `\`${value}\``;
    }

    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(value);
    }
}
