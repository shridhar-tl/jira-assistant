import CascadeSelect from './CascadeSelect';
import CommentsDisplay from './CommentsDisplay';
import DateDisplay from './DateDisplay';
import IssueDisplay from './IssueDisplay';
import ItemDisplay from './ItemDisplay';
import ProgressDisplay from './ProgressDisplay';
import ProjectDisplay from './ProjectDisplay';
import TagsDisplay from './TagsDisplay';
import TimeSpentDisplay from './TimeSpentDisplay';
import TimeTrackDisplay from './TimeTrackDisplay';
import UnknownItemDisplay from './UnknownItemDisplay';
import UserDisplay from './UserDisplay';

export { default as BaseControl } from './BaseControl';
export {
    CommentsDisplay,
    DateDisplay,
    IssueDisplay,
    ItemDisplay,
    ProgressDisplay,
    ProjectDisplay,
    TagsDisplay,
    TimeSpentDisplay,
    UnknownItemDisplay,
    UserDisplay,
};
export { default as IssueLinkDisplay } from './IssueLinkDisplay';
export { default as TicketDisplay, type TicketDisplayHandle } from './TicketDisplay';
export { default as DayColumn } from './DayColumn';
export { CascadeSelect, TimeTrackDisplay };

const knownTypes = ['number', 'string', 'date', 'datetime', 'parent', 'progress', 'project', 'timespent', 'timetracking', 'comments-page', 'user', 'votes', 'issuekey'];
const fixedValueObjectTypes = ['issuetype', 'status', 'resolution', 'priority'];
const keyFieldMapping: Record<string, string> = { parent: 'id', project: 'key' };
const comparibleTypesMapping: Record<string, string[]> = { timespent: ['number'], issuekey: ['string'] };

export function normalizeType(field: any): { type?: string; keyField?: string | string[] | ((v: any) => any); compatibleTypes?: string[]; knownObject?: boolean; isArray?: boolean } {
    return normalizeTypeWithOptions(field, keyFieldMapping, 'id');
}

export function normalizeTypeWithOptions(field: any, kfMapping: Record<string, string | string[] | ((v: any) => any)>, knownTypeFields: string | string[] | ((v: any) => any)): { type?: string; keyField?: string | string[] | ((v: any) => any); compatibleTypes?: string[]; knownObject?: boolean; isArray?: boolean } {
    const { schema, key } = field;
    const { type = key, system } = schema || { type: field.type || key };

    if (type === 'number' && system && (system.endsWith('timespent') || system.endsWith('estimate'))) {
        return { type: 'timespent', compatibleTypes: comparibleTypesMapping['timespent'] };
    }

    if (!system || knownTypes.includes(type)) {
        return { type, keyField: kfMapping[type], compatibleTypes: comparibleTypesMapping[type] };
    }

    if (fixedValueObjectTypes.includes(type)) {
        return { type, knownObject: true, keyField: knownTypeFields };
    }

    if (type === 'array') {
        return { type: schema?.items, isArray: true };
    }

    return { type };
}

export function getComponentFor(type: string): { Component: any; props?: any } {
    switch (type) {
        case 'ageindays':
            return { Component: DateDisplay, props: { quick: true } };
        case 'date':
            return { Component: DateDisplay, props: { dateOnly: true } };
        case 'datetime':
            return { Component: DateDisplay };
        case 'parent':
            return { Component: IssueDisplay, props: { settings: { valueType: 'both' } } };
        case 'issuekey':
            return { Component: IssueDisplay };
        case 'progress':
            return { Component: ProgressDisplay };
        case 'project':
            return { Component: ProjectDisplay, props: { settings: { valueType: 'both' } } };
        case 'timespent':
            return { Component: TimeSpentDisplay };
        case 'timetracking':
            return { Component: TimeTrackDisplay };
        case 'cascadeselect':
            return { Component: CascadeSelect };
        case 'comments-page':
        case 'comment':
            return { Component: CommentsDisplay };
        case 'user':
            return { Component: UserDisplay };
        case 'votes':
            return { Component: TagsDisplay, props: { tagProp: 'votes' } };
        case 'attachment':
            return { Component: TagsDisplay, props: { tagProp: 'filename', hrefProp: 'content', iconClass: 'fa-paperclip' } };
        case 'issuetype':
        case 'status':
        case 'resolution':
        case 'priority':
            return { Component: ItemDisplay };
        default:
            return { Component: UnknownItemDisplay };
    }
}
