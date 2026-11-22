import { Dropdown } from '@components';

import type { DatasourceConfigUIProps } from '@components/report-builder';

import { jiraListOptions, type JiraListKind, type JiraListsDatasourceConfig } from './jira-lists';

export default function JiraListsConfig({ datasourceId, config, onChange }: DatasourceConfigUIProps) {
    const cfg = config as unknown as JiraListsDatasourceConfig;
    const inputId = `ja-rb-list-${datasourceId}`;
    return (
        <div className="flex flex-col gap-1">
            <label htmlFor={inputId} className="text-xs font-medium text-(--text-secondary)">
                List
            </label>
            <Dropdown
                id={inputId}
                options={jiraListOptions}
                value={cfg.list}
                onChange={(e) => onChange({ ...cfg, list: e.value as JiraListKind } as unknown as Record<string, unknown>)}
                size="sm"
            />
            <span className="text-xs text-(--text-secondary)">
                Each row is one item of the list, such as a project or a status. Use it in tables, or as the options of a Dropdown parameter.
            </span>
        </div>
    );
}
