import type { PivotFieldConfig } from '../types';

type FieldBase = Pick<PivotFieldConfig, 'id' | 'key' | 'name' | 'schema'>;
type FieldProps = Omit<PivotFieldConfig, keyof FieldBase>;

/**
 * Custom field ids differ between Jira instances. These ids never exist in Jira,
 * so that the fields are always matched with the equivalent fields of the instance using their type and name.
 */
const sprintFieldId = 'customfield_1';
const storyPointsFieldId = 'customfield_2';

const systemField = (id: string, name: string, type: string, items?: string): FieldBase => ({
    id,
    key: id,
    name,
    schema: { type, system: id, ...(items && { items }) },
});

const derivedField = (id: string, key: string, name: string, type: string): FieldBase => ({
    id,
    key,
    name,
    schema: { type, derived: true, isArray: true },
});

const baseFields = {
    sprint: {
        id: sprintFieldId,
        key: sprintFieldId,
        name: 'Sprint',
        schema: { type: 'array', items: 'json', custom: 'com.pyxis.greenhopper.jira:gh-sprint' },
    },
    storyPoints: {
        id: storyPointsFieldId,
        key: storyPointsFieldId,
        name: 'Story Points',
        schema: { type: 'number', custom: 'com.atlassian.jira.plugin.system.customfieldtypes:float' },
    },
    issueKey: { id: 'issuekey', key: 'issuekey', name: 'Key', schema: { type: 'issuekey' } },
    parent: { id: 'parent', key: 'parent', name: 'Parent', schema: { type: 'parent' } },
    issueAge: { id: 'issueAge', key: 'created', name: 'Issue Age', schema: { type: 'ageindays' } },
    dateRange: { id: 'dateRange', key: '', name: 'Date Range', schema: { type: 'date-range', computed: true, depth: 1 } },
    status: systemField('status', 'Status', 'status'),
    assignee: systemField('assignee', 'Assignee', 'user'),
    issueType: systemField('issuetype', 'Issue Type', 'issuetype'),
    priority: systemField('priority', 'Priority', 'priority'),
    project: systemField('project', 'Project', 'project'),
    summary: systemField('summary', 'Summary', 'string'),
    labels: systemField('labels', 'Labels', 'array', 'string'),
    components: systemField('components', 'Components', 'array', 'component'),
    created: systemField('created', 'Created', 'datetime'),
    dueDate: systemField('duedate', 'Due date', 'date'),
    timeSpent: systemField('timespent', 'Time Spent', 'number'),
    remainingEstimate: systemField('timeestimate', 'Remaining Estimate', 'number'),
    worklogAuthor: derivedField('worklogAuthor', 'worklog.author', 'Worklog Added By', 'user'),
    worklogTime: derivedField('worklogTime', 'worklog.started', 'Worklog Time', 'datetime'),
    worklogTimeSpent: derivedField('worklogTimespent', 'worklog.timeSpentSeconds', 'Worklog Time spent', 'timespent'),
    worklogComment: derivedField('worklogComment', 'worklog.comment', 'Worklog Comment', 'string'),
    commentAuthor: derivedField('commentAuthor', 'comment.author', 'Comment Added By', 'user'),
    commentCreated: derivedField('commentCreated', 'comment.created', 'Comment Added Time', 'datetime'),
    fixVersionName: derivedField('fixVersionsName', 'fixVersions.name', 'Fix Version Name', 'string'),
    fixVersionReleaseDate: derivedField('fixVersionsReleaseDate', 'fixVersions.releaseDate', 'Fix Version Release Date', 'date'),
} satisfies Record<string, FieldBase>;

export type SampleFieldName = keyof typeof baseFields;

export function field(name: SampleFieldName, props?: FieldProps): PivotFieldConfig {
    const { schema, ...base } = baseFields[name];

    return { ...base, schema: { ...schema }, ...props };
}

export function issueCount(headerText = 'Issues'): PivotFieldConfig {
    return field('issueKey', { agrFunc: 'count', headerText });
}

export function storyPointsSum(headerText?: string): PivotFieldConfig {
    return field('storyPoints', { agrFunc: 'sum', ...(headerText && { headerText }) });
}

export function worklogPeriodColumn(rangeType: 'days' | 'week', props?: FieldProps): PivotFieldConfig {
    return field('dateRange', {
        colGroup: true,
        rangeType,
        dateRangeParameter: 'Period',
        filterField: 'worklog.started',
        showTotal: true,
        subItems: [field('worklogTimeSpent', { agrFunc: 'sum', format: 'TS_FR' })],
        ...props,
    });
}
