import { create } from 'zustand';

import { inject } from '@services';

import type { JiraField, FieldGroup } from '../types';

interface FieldsListState {
    fields: FieldGroup[];
    fieldsMap: Record<string, JiraField>;
}

export const useFieldsList = create<FieldsListState>(() => ({
    fields: [],
    fieldsMap: {},
}));

export async function fillFieldsList() {
    const fields = await getFieldsList();

    useFieldsList.setState({
        fields: [
            { label: 'Native', items: fields.native },
            { label: 'Custom', items: fields.custom },
            { label: 'Derived', items: fields.derived },
        ],
        fieldsMap: fields.fieldsMap,
    });
}

export async function getFieldsList() {
    const { $jira } = inject('JiraService');
    const fields = normalizeFields(await $jira.getCustomFields());

    const native: JiraField[] = [];
    const custom: JiraField[] = [];

    const fieldsMap: Record<string, JiraField> = {};

    fields.forEach((f) => {
        let keyLCase = f.key.toLowerCase();
        if (fieldsMap[keyLCase] && f.id) {
            keyLCase = f.id.toLowerCase();
        }

        fieldsMap[keyLCase] = f;

        if (f.custom) {
            const nameLCase = f.name.toLowerCase();

            if (!fieldsMap[nameLCase]) {
                fieldsMap[nameLCase] = f;
            }

            custom.push(f);
        } else {
            native.push(f);
        }
    });

    const derived = getDerivedFields();

    derived.forEach((f) => {
        let { key } = f;

        if (!key) {
            return;
        }

        if (fieldsMap[key]) {
            key = f.id;
        }

        fieldsMap[key.toLowerCase()] = f;
    });

    return { native, custom, derived, fieldsMap };
}

function getDerivedFields(): JiraField[] {
    return [
        {
            id: 'attachmentAuthor',
            key: 'attachment.author',
            name: 'Attachment Added By',
            schema: { type: 'user', derived: true, isArray: true },
        },
        {
            id: 'attachmentCreated',
            key: 'attachment.created',
            name: 'Attachment Added Time',
            schema: { type: 'datetime', derived: true, isArray: true },
        },
        {
            id: 'attachmentFileName',
            key: 'attachment.filename',
            name: 'Attachment File Name',
            schema: { type: 'string', derived: true, isArray: true },
        },
        {
            id: 'attachmentType',
            key: 'attachment.mimeType',
            name: 'Attachment Mime Type',
            schema: { type: 'string', derived: true, isArray: true },
        },
        { id: 'attachmentSize', key: 'attachment.size', name: 'Attachment Size', schema: { type: 'size', derived: true, isArray: true } },

        { id: 'commentAuthor', key: 'comment.author', name: 'Comment Added By', schema: { type: 'user', derived: true, isArray: true } },
        {
            id: 'commentCreated',
            key: 'comment.created',
            name: 'Comment Added Time',
            schema: { type: 'datetime', derived: true, isArray: true },
        },
        { id: 'commentBody', key: 'comment.body', name: 'Comment Body', schema: { type: 'string', derived: true, isArray: true } },
        {
            id: 'commentUpdateAuthor',
            key: 'comment.updateAuthor',
            name: 'Comment Updated By',
            schema: { type: 'user', derived: true, isArray: true },
        },
        {
            id: 'commentUpdated',
            key: 'comment.updated',
            name: 'Comment Updated Time',
            schema: { type: 'datetime', derived: true, isArray: true },
        },

        {
            id: 'componentsDescription',
            key: 'components.description',
            name: 'Component Description',
            schema: { type: 'string', derived: true, isArray: true },
        },
        { id: 'componentsName', key: 'components.name', name: 'Component Name', schema: { type: 'string', derived: true, isArray: true } },

        { id: 'dateRange', key: '', name: 'Date Range', schema: { type: 'date-range', computed: true, depth: 1 } },

        {
            id: 'fixVersionsArchived',
            key: 'fixVersions.archived',
            name: 'Fix Version Archived',
            schema: { type: 'bool', derived: true, isArray: true },
        },
        {
            id: 'fixVersionsName',
            key: 'fixVersions.name',
            name: 'Fix Version Name',
            schema: { type: 'string', derived: true, isArray: true },
        },
        {
            id: 'fixVersionsReleaseDate',
            key: 'fixVersions.releaseDate',
            name: 'Fix Version Release Date',
            schema: { type: 'date', derived: true, isArray: true },
        },
        {
            id: 'fixVersionsReleased',
            key: 'fixVersions.released',
            name: 'Fix Version Released',
            schema: { type: 'bool', derived: true, isArray: true },
        },

        {
            id: 'linkedIssuesLinkType',
            key: 'linkedIssues.linkType',
            name: 'Linked Issue Link Type',
            schema: { type: 'string', derived: true, isArray: true },
        },
        {
            id: 'linkedIssuesKey',
            key: 'linkedIssues.issuekey',
            name: 'Linked Issue Key',
            schema: { type: 'issuekey', derived: true, isArray: true },
        },
        {
            id: 'linkedIssuesSummary',
            key: 'linkedIssues.summary',
            name: 'Linked Issue Summary',
            schema: { type: 'string', derived: true, isArray: true },
        },
        {
            id: 'linkedIssuesStatus',
            key: 'linkedIssues.status',
            name: 'Linked Issue Status',
            schema: { type: 'status', derived: true, isArray: true },
        },
        {
            id: 'linkedIssuesIssueType',
            key: 'linkedIssues.issuetype',
            name: 'Linked Issue Type',
            schema: { type: 'issuetype', derived: true, isArray: true },
        },
        {
            id: 'linkedIssuesPriority',
            key: 'linkedIssues.priority',
            name: 'Linked Issue Priority',
            schema: { type: 'priority', derived: true, isArray: true },
        },
        {
            id: 'linkedIssuesTimeSpent',
            key: 'linkedIssues.timeSpent',
            name: 'Linked Issue Σ Time Spent',
            schema: { type: 'timespent', derived: true, isArray: true },
        },
        {
            id: 'linkedIssuesOriginalEstimate',
            key: 'linkedIssues.originalEstimate',
            name: 'Linked Issue Σ Original Estimate',
            schema: { type: 'timespent', derived: true, isArray: true },
        },
        {
            id: 'linkedIssuesRemainingEstimate',
            key: 'linkedIssues.remainingEstimate',
            name: 'Linked Issue Σ Remaining Estimate',
            schema: { type: 'timespent', derived: true, isArray: true },
        },

        { id: 'worklogAuthor', key: 'worklog.author', name: 'Worklog Added By', schema: { type: 'user', derived: true, isArray: true } },
        {
            id: 'worklogCreated',
            key: 'worklog.created',
            name: 'Worklog Added Time',
            schema: { type: 'datetime', derived: true, isArray: true },
        },
        { id: 'worklogComment', key: 'worklog.comment', name: 'Worklog Comment', schema: { type: 'string', derived: true, isArray: true } },
        { id: 'worklogTime', key: 'worklog.started', name: 'Worklog Time', schema: { type: 'datetime', derived: true, isArray: true } },
        {
            id: 'worklogTimespent',
            key: 'worklog.timeSpentSeconds',
            name: 'Worklog Time spent',
            schema: { type: 'timespent', derived: true, isArray: true },
        },
        {
            id: 'worklogUpdateAuthor',
            key: 'worklog.updateAuthor',
            name: 'Worklog Updated By',
            schema: { type: 'user', derived: true, isArray: true },
        },
        {
            id: 'worklogUpdated',
            key: 'worklog.updated',
            name: 'Worklog Updated Time',
            schema: { type: 'datetime', derived: true, isArray: true },
        },
    ].sort((a, b) => a.name.localeCompare(b.name));
}

function normalizeFields(fields: any[]): JiraField[] {
    return fields
        .filter(filterFields)
        .map((f) => {
            const { id, name, custom } = f;
            let { key, schema } = f;

            // Custom fields of apps (like Forge) have a key different from their id, whereas issue fields are always returned by id
            if (!key || (custom && id?.startsWith(customFieldIdPrefix))) {
                key = id;
            }

            if (!schema) {
                schema = { type: key };
            }

            return { id, key, name, custom, schema };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
}

const customFieldIdPrefix = 'customfield_';

const cleanupKeys = ['worklog', 'comment', 'attachment'];
function filterFields(f: any) {
    return !cleanupKeys.includes(f.key);
}
