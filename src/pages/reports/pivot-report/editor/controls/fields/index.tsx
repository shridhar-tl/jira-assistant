import { useEffect, useMemo } from 'react';

import { stop } from '@/utils';

import type { ComponentEvent } from '@components';
import { TextInput } from '@components';

import { Draggable } from '@controls';

import { useFieldFilterText } from '../../../store/pivot-config';
import type { JiraField } from '../../../types';
import { fillFieldsList, useFieldsList } from '../../../utils/fields';
import { getFieldType } from '../../../viewer/common-utils';

const typeIcons: Record<string, string> = {
    user: 'fa-user',
    date: 'fa-calendar',
    datetime: 'fa-clock',
    'date-range': 'fa-calendar-week',
    ageindays: 'fa-hourglass-half',
    number: 'fa-hashtag',
    timespent: 'fa-stopwatch',
    string: 'fa-font',
    array: 'fa-list',
    project: 'fa-folder',
    parent: 'fa-sitemap',
    issuekey: 'fa-key',
    status: 'fa-circle-half-stroke',
    priority: 'fa-arrow-up-wide-short',
    issuetype: 'fa-shapes',
};

const defaultTypeIcon = 'fa-tag';

function getTypeIcon(field: JiraField) {
    if (field.schema?.isArray && field.schema?.type !== 'user') {
        return typeIcons[field.schema.type || ''] || typeIcons.array;
    }

    return typeIcons[getFieldType(field) || ''] || defaultTypeIcon;
}

export default function FieldsCollection() {
    const fields = useFieldsList(({ fields }) => fields);

    useEffect(() => {
        fillFieldsList();
    }, []);

    return (
        <div className="flex h-full min-h-0 flex-col">
            <SearchBox />
            <div className="min-h-0 flex-1 overflow-y-auto">
                {!fields.length && (
                    <div className="flex items-center gap-2 p-4 text-sm text-(--text-secondary)">
                        <span className="fa fa-spinner fa-spin" /> Loading fields from Jira...
                    </div>
                )}
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
        <div className="border-b border-(--border-primary) p-3">
            <TextInput
                value={searchText}
                placeholder="Search fields..."
                onChange={(e: ComponentEvent<string>) => setSearchText(e.value)}
                onClear={() => setSearchText('')}
                leftIcon={<span className="fa fa-search text-xs" />}
                clearable
                className="w-full"
            />
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
    const items = useMemo(() => getFilteredFields(fields, searchText), [fields, searchText]);

    if (!items?.length) {
        return null;
    }

    return (
        <div className="border-b border-(--border-primary) p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-(--text-secondary)">
                <span>{title}</span>
                <span className="rounded-full bg-(--bg-tertiary) px-2 py-0.5 text-[11px] font-medium normal-case tracking-normal">
                    {items.length}
                </span>
            </div>
            <div className="space-y-0.5">
                {items.map((field, i) => (
                    <Draggable
                        key={field.id || i}
                        containerId="jira-fields"
                        index={i}
                        className="jira-field"
                        itemType="jira-field"
                        item={field}
                    >
                        <div className="group flex cursor-move items-center gap-2 rounded-md border border-transparent px-2 py-1.5 transition-colors hover:border-(--border-primary) hover:bg-(--bg-secondary)">
                            <span className={`fa ${getTypeIcon(field)} w-4 shrink-0 text-center text-xs text-(--text-tertiary)`} />
                            <span
                                className="min-w-0 flex-1 truncate text-sm text-(--text-primary)"
                                title={`${field.name} (${field.key || field.id})`}
                            >
                                {field.name}
                            </span>
                            {field.key && (
                                <button
                                    type="button"
                                    className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-(--text-tertiary) opacity-60 transition hover:bg-(--bg-hover) hover:text-(--text-primary) hover:opacity-100 group-hover:opacity-100"
                                    onClick={(e) => copyForFilter(e, field)}
                                    title="Copy field name to use in filter"
                                    aria-label={`Copy ${field.name} for filter`}
                                >
                                    <span className="fa fa-copy text-xs" />
                                </button>
                            )}
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
