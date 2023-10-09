import { inject } from '../../../../services';
import { create } from 'zustand';

export const useFieldsList = create(() => ({
    fields: [], fieldsMap: {}
}));

export async function fillFieldsList() {
    const fields = await getFieldsList();

    useFieldsList.setState({
        fields: [
            { label: 'Native', items: fields.native },
            { label: 'Custom', items: fields.custom },
            { label: 'Derived', items: fields.derived }
        ],
        fieldsMap: fields.fieldsMap
    });
}

export async function getFieldsList() {
    const { $jira } = inject('JiraService');
    const fields = normalizeFields(await $jira.getCustomFields());

    const native = [], custom = [];

    const fieldsMap = {};

    fields.forEach(f => {
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

    const derived = getDerivedFields(native, custom);

    derived.forEach(f => {
        let { key } = f;

        if (!key) { return; }

        if (fieldsMap[key]) {
            key = f.id;
        }

        fieldsMap[key.toLowerCase()] = f;
    });

    return { native, custom, derived, fieldsMap };
}

function getDerivedFields() {
    return [
        { id: 'attachmentAuthor', key: 'attachment.author', name: 'Attachment Added By', schema: { type: 'user', derived: true, isArray: true } },
        { id: 'attachmentCreated', key: 'attachment.created', name: 'Attachment Added Time', schema: { type: 'datetime', derived: true, isArray: true } },
        { id: 'attachmentFileName', key: 'attachment.filename', name: 'Attachment File Name', schema: { type: 'string', derived: true, isArray: true } },
        { id: 'attachmentType', key: 'attachment.mimeType', name: 'Attachment Mime Type', schema: { type: 'string', derived: true, isArray: true } },
        { id: 'attachmentSize', key: 'attachment.size', name: 'Attachment Size', schema: { type: 'size', derived: true, isArray: true } },

        { id: 'commentAuthor', key: 'comment.author', name: 'Comment Added By', schema: { type: 'user', derived: true, isArray: true } },
        { id: 'commentCreated', key: 'comment.created', name: 'Comment Added Time', schema: { type: 'datetime', derived: true, isArray: true } },
        { id: 'commentBody', key: 'comment.body', name: 'Comment Body', schema: { type: 'string', derived: true, isArray: true } },
        { id: 'commentUpdateAuthor', key: 'comment.updateAuthor', name: 'Comment Updated By', schema: { type: 'user', derived: true, isArray: true } },
        { id: 'commentUpdated', key: 'comment.updated', name: 'Comment Updated Time', schema: { type: 'datetime', derived: true, isArray: true } },

        { id: 'componentsDescription', key: 'components.description', name: 'Component Description', schema: { type: 'string', derived: true, isArray: true } },
        { id: 'componentsName', key: 'components.name', name: 'Component Name', schema: { type: 'string', derived: true, isArray: true } },

        { id: 'dateRange', key: '', name: 'Date Range', schema: { type: 'date-range', computed: true, depth: 1 } },

        { id: 'fixVersionsArchived', key: 'fixVersions.archived', name: 'Fix Version Archived', schema: { type: 'bool', derived: true, isArray: true } },
        { id: 'fixVersionsName', key: 'fixVersions.name', name: 'Fix Version Name', schema: { type: 'string', derived: true, isArray: true } },
        { id: 'fixVersionsReleaseDate', key: 'fixVersions.releaseDate', name: 'Fix Version Release Date', schema: { type: 'date', derived: true, isArray: true } },
        { id: 'fixVersionsReleased', key: 'fixVersions.released', name: 'Fix Version Released', schema: { type: 'bool', derived: true, isArray: true } },

        { id: 'worklogAuthor', key: 'worklog.author', name: 'Worklog Added By', schema: { type: 'user', derived: true, isArray: true } },
        { id: 'worklogCreated', key: 'worklog.created', name: 'Worklog Added Time', schema: { type: 'datetime', derived: true, isArray: true } },
        { id: 'worklogComment', key: 'worklog.comment', name: 'Worklog Comment', schema: { type: 'string', derived: true, isArray: true } },
        { id: 'worklogTime', key: 'worklog.started', name: 'Worklog Time', schema: { type: 'datetime', derived: true, isArray: true } },
        { id: 'worklogTimespent', key: 'worklog.timeSpentSeconds', name: 'Worklog Time spent', schema: { type: 'timespent', derived: true, isArray: true } },
        { id: 'worklogUpdateAuthor', key: 'worklog.updateAuthor', name: 'Worklog Updated By', schema: { type: 'user', derived: true, isArray: true } },
        { id: 'worklogUpdated', key: 'worklog.updated', name: 'Worklog Updated Time', schema: { type: 'datetime', derived: true, isArray: true } },

    ].orderBy(f => f.name);
}

function normalizeFields(fields) {
    return fields.filter(filterFields).map(f => {
        const { id, key, name, custom } = f;
        let { schema } = f;

        if (!schema) {
            schema = { type: key };
        }

        return { id, key, name, custom, schema };
    }).orderBy(f => f.name);
}

const cleanupKeys = ['worklog', 'comment', 'attachment'];
function filterFields(f) {
    return !cleanupKeys.includes(f.key);
}