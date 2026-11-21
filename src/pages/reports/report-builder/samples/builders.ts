import type {
    ChartComponentProps,
    ChartType,
    ColumnsComponentProps,
    ComponentStyleProps,
    ConditionalFormat,
    DatasourceConfig,
    DerivedDatasourceConfig,
    DerivedTransform,
    HeaderComponentProps,
    ParameterConfig,
    ReportComponent,
    TableCellItem,
    TableColumnDef,
    TableComponentProps,
    TextComponentProps,
} from '@components/report-builder';

import type { SelectedIssueField } from '../config/jira-fields';
import { issueAgeFieldId } from '../config/jira-fields';
import type { JqlDatasourceConfig } from '../datasources/jql-plugin';
import { jqlDatasourceType } from '../datasources/jql-plugin';
import type { SprintIssuesDatasourceConfig } from '../datasources/sprint-issues-plugin';
import { sprintIssuesDatasourceType } from '../datasources/sprint-issues-plugin';
import type { SprintsDatasourceConfig, SprintStateName } from '../datasources/sprints-plugin';
import { sprintsDatasourceType } from '../datasources/sprints-plugin';
import type { WorklogsDatasourceConfig, WorklogUserMode } from '../datasources/worklogs-plugin';
import { worklogsDatasourceType } from '../datasources/worklogs-plugin';

import { storyPointsFieldId } from './custom-fields';

const derivedType = 'derived';

const systemField = (id: string, name: string, schemaType?: string, itemsType?: string): SelectedIssueField => ({
    id,
    alias: id,
    name,
    ...(schemaType && { schemaType }),
    ...(itemsType && { itemsType }),
});

export const fields = {
    summary: systemField('summary', 'Summary', 'string'),
    status: systemField('status', 'Status', 'status'),
    assignee: systemField('assignee', 'Assignee', 'user'),
    reporter: systemField('reporter', 'Reporter', 'user'),
    issueType: systemField('issuetype', 'Issue Type', 'issuetype'),
    priority: systemField('priority', 'Priority', 'priority'),
    project: systemField('project', 'Project', 'project'),
    created: systemField('created', 'Created', 'datetime'),
    updated: systemField('updated', 'Updated', 'datetime'),
    resolved: systemField('resolutiondate', 'Resolved', 'datetime'),
    dueDate: systemField('duedate', 'Due date', 'date'),
    labels: systemField('labels', 'Labels', 'array', 'string'),
    components: systemField('components', 'Components', 'array', 'component'),
    fixVersions: systemField('fixVersions', 'Fix versions', 'array', 'version'),
    parent: { id: 'parent', alias: 'parent', name: 'Parent' } satisfies SelectedIssueField,
    timeSpent: systemField('timespent', 'Time Spent', 'number'),
    originalEstimate: systemField('timeoriginalestimate', 'Original Estimate', 'number'),
    remainingEstimate: systemField('timeestimate', 'Remaining Estimate', 'number'),
    issueAge: systemField(issueAgeFieldId, 'Issue Age', 'ageindays'),
    storyPoints: { id: storyPointsFieldId, alias: 'storyPoints', name: 'Story Points', schemaType: 'number' } satisfies SelectedIssueField,
};

export const projectsParameter: ParameterConfig = {
    id: 'p-projects',
    name: 'projects',
    label: 'Projects',
    type: 'jira-projects' as ParameterConfig['type'],
    mandatory: true,
    allowMultiple: true,
    typeConfig: {},
};

export const sprintsParameter: ParameterConfig = {
    id: 'p-sprints',
    name: 'sprints',
    label: 'Sprints',
    type: 'jira-sprints' as ParameterConfig['type'],
    mandatory: true,
    typeConfig: {},
};

export const boardsParameter: ParameterConfig = {
    id: 'p-boards',
    name: 'boards',
    label: 'Agile boards',
    type: 'jira-boards' as ParameterConfig['type'],
    mandatory: true,
    allowMultiple: true,
    typeConfig: {},
};

export const userGroupsParameter: ParameterConfig = {
    id: 'p-groups',
    name: 'groups',
    label: 'User groups',
    type: 'user-groups' as ParameterConfig['type'],
    mandatory: true,
    allowMultiple: true,
    typeConfig: {},
};

export function dateParameter(name: string, label: string, description: string): ParameterConfig {
    return { id: `p-${name}`, name, label, description, type: 'date-picker', mandatory: false, typeConfig: {} };
}

export function numberParameter(name: string, label: string, defaultValue: number, minValue = 1): ParameterConfig {
    return {
        id: `p-${name}`,
        name,
        label,
        type: 'numeric',
        mandatory: true,
        defaultValue,
        typeConfig: {},
        validation: { minValue },
    };
}

export function jqlSource(id: string, name: string, jql: string, issueFields: SelectedIssueField[], maxResults?: number): DatasourceConfig {
    const config: JqlDatasourceConfig = { jql, fields: issueFields, ...(maxResults && { maxResults }) };
    return { id, name, type: jqlDatasourceType, config: config as unknown as Record<string, unknown> };
}

export function sprintIssuesSource(id: string, name: string, issueFields: SelectedIssueField[], jql?: string): DatasourceConfig {
    const config: SprintIssuesDatasourceConfig = {
        sprintMode: 'expression',
        boards: [],
        sprintSelection: {},
        sprintExpression: 'Parameters.sprints',
        fields: issueFields,
        ...(jql && { jql }),
    };
    return { id, name, type: sprintIssuesDatasourceType, config: config as unknown as Record<string, unknown> };
}

export function sprintsSource(id: string, name: string, states: SprintStateName[], lastCount?: number): DatasourceConfig {
    const config: SprintsDatasourceConfig = {
        boardMode: 'expression',
        boards: [],
        boardExpression: 'Parameters.boards',
        states,
        ...(lastCount && { lastCount }),
    };
    return { id, name, type: sprintsDatasourceType, config: config as unknown as Record<string, unknown> };
}

interface WorklogsOptions {
    userMode: WorklogUserMode;
    userExpression?: string;
    jql?: string;
    issueFields?: SelectedIssueField[];
    defaultFrom: string;
    defaultTo: string;
}

export function worklogsSource(id: string, name: string, options: WorklogsOptions): DatasourceConfig {
    const config: WorklogsDatasourceConfig = {
        fromExpression: `IfNull(Parameters.fromDate, ${options.defaultFrom})`,
        toExpression: `IfNull(Parameters.toDate, ${options.defaultTo})`,
        userMode: options.userMode,
        groupNames: [],
        issueFields: options.issueFields ?? [],
        ...(options.userExpression && { userExpression: options.userExpression }),
        ...(options.jql && { jql: options.jql }),
    };
    return { id, name, type: worklogsDatasourceType, config: config as unknown as Record<string, unknown> };
}

export function derivedSource(id: string, name: string, sourceDatasourceId: string, transforms: DerivedTransform[], description?: string): DatasourceConfig {
    const config: DerivedDatasourceConfig = { sourceDatasourceId, transforms };
    return { id, name, type: derivedType, config: config as unknown as Record<string, unknown>, ...(description && { description }) };
}

function component(id: string, type: string, props: object, styles: ComponentStyleProps = {}, children?: ReportComponent[]): ReportComponent {
    return { id, type, props: props as Record<string, unknown>, styles, ...(children && { children }) };
}

export function header(id: string, content: string, level: HeaderComponentProps['level'] = 'h2'): ReportComponent {
    return component(id, 'header', { level, content } satisfies HeaderComponentProps);
}

export function text(id: string, content: string, styles: ComponentStyleProps = { fontSize: 13 }): ReportComponent {
    return component(id, 'text', { content } satisfies TextComponentProps, styles);
}

export function divider(id: string): ReportComponent {
    return component(id, 'horizontal-line', { thickness: 1, marginTop: 4, marginBottom: 4 });
}

export function columns(id: string, ...cells: ReportComponent[][]): ReportComponent {
    return component(
        id,
        'columns',
        { columnCount: cells.length } satisfies ColumnsComponentProps,
        {},
        cells.map((children, i) => component(`${id}-c${i + 1}`, 'column', {}, {}, children)),
    );
}

type ColumnOptions = Omit<Partial<TableColumnDef>, 'id' | 'field' | 'label'>;

export function col(field: string, label: string, options: ColumnOptions = {}): TableColumnDef {
    return { kind: 'column', id: `col-${field.replace(/[^A-Za-z0-9]/g, '-')}`, field, label, ...options };
}

export const issueKeyColumn = col('key', 'Key', {
    width: '110px',
    cellItems: [
        {
            id: 'key-link',
            type: 'field',
            fieldPath: 'key',
            clickAction: 'link',
            href: '=IssueUrl(Field.key)',
        } satisfies TableCellItem,
    ],
});

export function dateColumn(field: string, label: string, options: ColumnOptions = {}): TableColumnDef {
    return col(field, label, { width: '120px', formatExpr: `=FormatUserDate(Field.${field})`, ...options });
}

export function hoursColumn(field: string, label: string, secondsField = false): TableColumnDef {
    return col(field, label, {
        width: '100px',
        align: 'right',
        formatExpr: secondsField ? `=FormatNumber(Hours(Field.${field}, 2), 2)` : `=FormatNumber(Field.${field}, 2)`,
    });
}

export function rule(id: string, expression: string, backgroundColor: string, textColor = '#111827', bold = false): ConditionalFormat {
    return { id, expression, backgroundColor, textColor, fontWeight: bold ? 'bold' : 'normal', fontStyle: 'normal' };
}

type TableOptions = Omit<Partial<TableComponentProps>, 'datasourceId' | 'columns' | 'columnTree'>;

export function table(id: string, datasourceId: string, tableColumns: TableColumnDef[], options: TableOptions = {}): ReportComponent {
    const props: TableComponentProps = {
        datasourceId,
        columns: tableColumns,
        columnTree: tableColumns,
        enableSorting: true,
        enableCopyData: true,
        ...options,
    };
    return component(id, 'table', props);
}

type ChartOptions = Omit<Partial<ChartComponentProps>, 'datasourceId'>;

export function chart(id: string, type: ChartType, datasourceId: string, options: ChartOptions): ReportComponent {
    const props: ChartComponentProps = { datasourceId, showLegend: true, legendPosition: 'bottom', tooltipEnabled: true, height: 300, ...options };
    return component(id, type, props);
}
