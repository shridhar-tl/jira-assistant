import { useMemo } from 'react';

import { TextArea } from '@components';
import type { ComponentEvent } from '@components';

import { updateItemByPath, useSelectedItemConfig } from '../../../../store/pivot-config';
import type { PivotFieldConfig } from '../../../../types';
import { useFieldsList } from '../../../../utils/fields';
import PropertyRow from '../PropertyRow';

import { validateFilterText } from './validators';

interface QueryFilterProps {
    filterText?: string;
    item: PivotFieldConfig;
    isRow?: boolean;
}

interface FilterExample {
    query: string;
    description: string;
}

const filterExamples: FilterExample[] = [
    { query: "status != 'Done' and issuetype in ('Bug', 'Story')", description: 'Compare with values or a list of values' },
    { query: "assignee = currentUser() or labels = 'backend'", description: 'Match users or values of multi-value fields' },
    { query: '`Story Points` between 3 and 8', description: 'Wrap field names having space within backticks' },
    { query: "summary like '%payment%'", description: 'Use % as wildcard to match part of the text' },
    { query: "created >= today(-7) and date_diff(now(), updated, 'days') > 2", description: 'Compare dates relative to today' },
    { query: "assignee in (parameters('Team members'))", description: 'Ask for the value every time the report is generated' },
];

const filterHelpText =
    'Only the issues matching this filter are included under this field. Use the copy icon in the fields list to copy a field name.';

export default function QueryFilter({ filterText, item, isRow }: QueryFilterProps) {
    const { itemPath } = useSelectedItemConfig();
    const fieldsMap = useFieldsList((f) => f.fieldsMap);

    const validation = useMemo(
        () => (filterText?.trim() ? validateFilterText(filterText, { fieldsMap, fields: {}, parameters: {} }) : null),
        [filterText, fieldsMap],
    );

    const handleChange = ({ value }: ComponentEvent<string>) => {
        updateItemByPath({ ...item, filter: value }, null, { args: { itemPath, isRow } });
    };

    const error = validation && !validation.isValid ? validation.errorMessage : undefined;

    return (
        <PropertyRow label="Filter issues" className="sm:col-span-2">
            <TextArea
                value={filterText || ''}
                onChange={handleChange}
                rows={3}
                autoResize
                placeholder="e.g. status != 'Done' and assignee = currentUser()"
                className="font-mono text-sm"
                invalid={!!error}
                error={error}
                helperText={!error ? filterHelpText : undefined}
            />
            {validation?.isValid && (
                <span className="flex items-center gap-1.5 text-xs text-(--color-success)">
                    <i className="fa fa-circle-check" /> Filter is valid
                </span>
            )}
            <details className="group rounded-md border border-(--border-primary) bg-(--bg-secondary)">
                <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-semibold text-(--text-secondary) [&::-webkit-details-marker]:hidden">
                    <i className="fa fa-lightbulb" />
                    Filter syntax examples
                    <i className="fa fa-chevron-right ml-auto text-[10px] transition-transform group-open:rotate-90" />
                </summary>
                <ul className="space-y-2 border-t border-(--border-primary) px-3 py-2">
                    {filterExamples.map(({ query, description }) => (
                        <li key={query} className="flex flex-col gap-0.5">
                            <code className="break-all text-xs text-(--text-primary)">{query}</code>
                            <span className="text-xs text-(--text-tertiary)">{description}</span>
                        </li>
                    ))}
                </ul>
            </details>
        </PropertyRow>
    );
}
