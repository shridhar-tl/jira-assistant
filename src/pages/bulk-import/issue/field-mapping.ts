// Field mapping and column creation logic

import { IssueColumn } from './types';

/**
 * Get default columns for issue import
 */
export function getDefaultColumns(): IssueColumn[] {
    return [
        {
            field: 'issuekey',
            displayText: 'Issue Key',
            width: 120,
            cellEditable: true,
            headerEditable: false,
        },
        {
            field: 'project',
            displayText: 'Project',
            width: 100,
            cellEditable: true,
            headerEditable: false,
        },
        {
            field: 'issuetype',
            displayText: 'Issue Type',
            width: 120,
            cellEditable: true,
            headerEditable: false,
        },
        {
            field: 'summary',
            displayText: 'Summary',
            width: 250,
            cellEditable: true,
            headerEditable: false,
        },
        {
            field: 'parent',
            displayText: 'Parent',
            width: 120,
            cellEditable: true,
            headerEditable: false,
        },
        {
            field: 'delete',
            displayText: 'Delete',
            width: 70,
            cellEditable: true,
            headerEditable: false,
        },
        {
            field: 'clone',
            displayText: 'Clone',
            width: 70,
            cellEditable: true,
            headerEditable: false,
        },
    ];
}

/**
 * Create column mapping from Jira fields
 */
export function createColumnMapping(jiraFields: any[]): Record<string, any> {
    const mapping: Record<string, any> = {};

    jiraFields.forEach((field) => {
        const key = field.key || field.id;
        if (key) {
            mapping[key] = field;
        }
    });

    return mapping;
}

/**
 * Get invalid header template
 */
export function getInvalidHeaderTemplate() {
    return (column: IssueColumn) => {
        return `${column.field} ❌`;
    };
}

/**
 * Get unsupported field template
 */
export function getUnsupportedFieldTemplate() {
    return (column: IssueColumn) => {
        return `${column.field} ⚠️`;
    };
}

/**
 * Get field display name
 */
export function getFieldDisplayName(field: string): string {
    const displayNames: Record<string, string> = {
        issuekey: 'Issue Key',
        project: 'Project',
        issuetype: 'Issue Type',
        summary: 'Summary',
        description: 'Description',
        assignee: 'Assignee',
        reporter: 'Reporter',
        priority: 'Priority',
        status: 'Status',
        labels: 'Labels',
        components: 'Components',
        fixVersions: 'Fix Versions',
        versions: 'Affected Versions',
        duedate: 'Due Date',
        parent: 'Parent',
        delete: 'Delete',
        clone: 'Clone',
    };

    return displayNames[field] || field;
}

/**
 * Get basic column mapping for common fields
 * This is a simplified version - in production, you'd get this from Jira metadata
 */
export function getColumnMapping(): Record<string, any> {
    return {
        issuekey: {
            key: 'issuekey',
            name: 'Issue Key',
            schema: { type: 'string' },
        },
        project: {
            key: 'project',
            name: 'Project',
            schema: { type: 'project' },
            required: true,
        },
        issuetype: {
            key: 'issuetype',
            name: 'Issue Type',
            schema: { type: 'issuetype' },
            required: true,
        },
        summary: {
            key: 'summary',
            name: 'Summary',
            schema: { type: 'string' },
            required: true,
        },
        description: {
            key: 'description',
            name: 'Description',
            schema: { type: 'string' },
        },
        assignee: {
            key: 'assignee',
            name: 'Assignee',
            schema: { type: 'user' },
        },
        reporter: {
            key: 'reporter',
            name: 'Reporter',
            schema: { type: 'user' },
        },
        priority: {
            key: 'priority',
            name: 'Priority',
            schema: { type: 'priority' },
        },
        status: {
            key: 'status',
            name: 'Status',
            schema: { type: 'status' },
        },
        labels: {
            key: 'labels',
            name: 'Labels',
            schema: { type: 'array', items: 'string' },
        },
        components: {
            key: 'components',
            name: 'Components',
            schema: { type: 'array', items: 'component' },
        },
        fixversions: {
            key: 'fixVersions',
            name: 'Fix Versions',
            schema: { type: 'array', items: 'version' },
        },
        versions: {
            key: 'versions',
            name: 'Affected Versions',
            schema: { type: 'array', items: 'version' },
        },
        duedate: {
            key: 'duedate',
            name: 'Due Date',
            schema: { type: 'date' },
        },
        parent: {
            key: 'parent',
            name: 'Parent',
            schema: { type: 'issuelink' },
        },
        environment: {
            key: 'environment',
            name: 'Environment',
            schema: { type: 'string' },
        },
    };
}
