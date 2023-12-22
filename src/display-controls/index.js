import { getUserName } from 'src/common/utils';
import CommentsDisplay from './CommentsDisplay';
import DateDisplay from './DateDisplay';
import IssueDisplay from './IssueDisplay';
import IssueLinkDisplay from './IssueLinkDisplay';
import ItemDisplay from './ItemDisplay';
import ProgressDisplay from './ProgressDisplay';
import ProjectDisplay from './ProjectDisplay';
import TagsDisplay from './TagsDisplay';
import TicketDisplay from './TicketDisplay';
import TimeSpentDisplay from './TimeSpentDisplay';
import TimeTrackDisplay from './TimeTrackDisplay';
import UnknownItemDisplay from './UnknownItemDisplay';
import UserDisplay from './UserDisplay';
import CascadeSelect from './CascadeSelect';

export {
    CommentsDisplay, DateDisplay, IssueDisplay, IssueLinkDisplay,
    ItemDisplay, ProgressDisplay, ProjectDisplay, TagsDisplay, TicketDisplay,
    TimeSpentDisplay, TimeTrackDisplay, UnknownItemDisplay, UserDisplay
};

export function getComponentFor(type) {
    switch (type) {
        case 'ageindays': return { Component: DateDisplay, props: { quick: true } };
        case 'date': return { Component: DateDisplay, props: { dateOnly: true } };
        case 'datetime': return { Component: DateDisplay };
        case 'parent': return { Component: IssueDisplay, props: { settings: { valueType: 'both' } } };
        case 'issuekey': return { Component: IssueDisplay };
        case 'progress': return { Component: ProgressDisplay };
        case 'project': return { Component: ProjectDisplay, props: { settings: { valueType: 'both' } } };
        case 'timespent': return { Component: TimeSpentDisplay };
        case 'timetracking': return { Component: TimeTrackDisplay };
        case 'comments-page': case 'comment': return { Component: CommentsDisplay };
        case 'user': return { Component: UserDisplay };
        case 'votes': return { Component: TagsDisplay, props: { tagProp: 'votes' } };
        case 'attachment': return { Component: TagsDisplay, props: { tagProp: 'filename', hrefProp: 'content', iconClass: 'fa-paperclip' } };
        case 'issuetype':
        case 'status':
        case 'resolution':
        case 'priority':
            return { Component: ItemDisplay };
        case 'option-with-child':
            return { Component: CascadeSelect };
        default: return { Component: UnknownItemDisplay };
    }
}

const knownTypes = [
    'number',
    'string',
    'date',
    'datetime',
    'parent',
    'progress',
    'project',
    'timespent',
    'timetracking',
    'comments-page',
    'user',
    'votes',
    'issuekey'
];
const fixedValueObjectTypes = [
    'issuetype',
    'status',
    'resolution',
    'priority'
];
const keyFieldMapping = {
    parent: 'id',
    project: 'key',
    user: getUserName
};

const comparibleTypesMapping = {
    timespent: ['number'],
    issuekey: ['string']
};

export function normalizeType(field) {
    return normalizeTypeWithOptions(field, keyFieldMapping, 'id');
}

export function normalizeTypeWithOptions(field, keyFieldMapping, knownTypeFields) {
    const { schema, key } = field;
    const { type = key, system } = schema || { type: field.type || key };

    if (type === 'number' && system && (system.endsWith('timespent') || system.endsWith('estimate'))) {
        return { type: 'timespent', compatibleTypes: comparibleTypesMapping['timespent'] };
    }

    if (!system || knownTypes.includes(type)) {
        return { type, keyField: keyFieldMapping[type], compatibleTypes: comparibleTypesMapping[type] };
    }

    if (fixedValueObjectTypes.includes(type)) {
        return { type, knownObject: true, keyField: knownTypeFields };
    }

    if (type === 'array') {
        return { type: schema.items, isArray: true };
    }

    return type;
}

