import { distinct, first, mapAsync } from '@utils/array-utils';

import { prepareParentAndProjectFields, repeatIssuesWithMultiValues } from '@pages/bulk-import/issue/data-processor';

import type JiraService from './jira-service';
import type MessageService from './message-service';
import type UserUtilsService from './userutils-service';
import type UtilsService from './utils-service';

const msgValueRequired = 'Value is required';
const msgValueInvalid = 'Invalid value for this field';
const msgInvalidForCreation = 'Not an allowed field while creation of issue. Will try to update after issue is created.';

const commonTicketFields = [
    'summary',
    'assignee',
    'reporter',
    'priority',
    'status',
    'resolution',
    'created',
    'updated',
    'issuetype',
    'parent',
];

const ignoredFields = ['selected', 'issuekey', 'delete', 'clone', 'importStatus'];

// Helper functions
function compareIgnoreCase(str1?: string | null, str2?: string | null): boolean {
    const s1 = (str1 || '').toLowerCase();
    const s2 = (str2 || '').toLowerCase();
    return s1 === s2;
}

const comparisonCharsRegex = /[ \-_]/g;
function prepareForCompare(value: any): string {
    if (!value) return value;

    if (typeof value === 'string') {
        return value.replace(comparisonCharsRegex, '').toLowerCase();
    }
    return value.toString().toLowerCase();
}

interface ValueObj {
    value?: any;
    displayText?: string;
    avatarUrl?: string;
    jiraValue?: any;
    error?: string;
    warning?: string;
    allowedValues?: any[];
    autoCompleteUrl?: string;
    isArray?: boolean;
    delete?: boolean;
}

interface ImportStatus {
    hasError?: boolean;
    hasWarning?: boolean;
    error?: string;
    warning?: string;
    imported?: boolean;
    actions?: Record<string, boolean>;
    createMetadata?: any;
    updateMetadata?: any;
}

interface Issue {
    [key: string]: ValueObj | any;
    issuekey: ValueObj;
    project: ValueObj;
    issuetype: ValueObj;
    parent: ValueObj;
    summary: ValueObj;
    importStatus?: ImportStatus;
    disabled?: boolean;
    selected?: boolean;
    delete?: boolean;
    clone?: boolean;
}

interface Column {
    field: string;
    displayText?: string;
    fieldType?: string;
    custom?: boolean;
    headerEditable?: boolean;
    required?: boolean;
    hasError?: boolean;
}

export default class TicketService {
    static dependencies = ['JiraService', 'MessageService', 'UtilsService', 'UserUtilsService'];

    private $jira: JiraService;
    private $message: MessageService;
    private $utils: UtilsService;
    private $userutils: UserUtilsService;
    private ticketsCache: Record<string, any> = {};
    private projectImportMetadata: Record<string, any> = {};

    constructor($jira: JiraService, $message: MessageService, $utils: UtilsService, $userutils: UserUtilsService) {
        this.$jira = $jira;
        this.$message = $message;
        this.$utils = $utils;
        this.$userutils = $userutils;
    }

    /**
     * Get ticket details - main entry point for fetching tickets
     */
    async getTicketDetails(
        tickets: string | string[],
        asArr?: boolean,
        ticketFields?: string[],
        options?: { allowCache?: boolean; ignoreErrors?: boolean; ignoreWarnings?: boolean },
    ): Promise<any> {
        if (!tickets) return null;

        let onlyOne = false;
        let ticketList: string[];

        if (typeof tickets === 'string') {
            ticketList = [tickets];
            onlyOne = true;
        } else {
            ticketList = tickets;
        }

        const { allowCache, ...opts } = options || {};
        const fields = ticketFields || commonTicketFields;

        const arr = await this.fetchTicketDetails(ticketList, fields, opts);
        const result: Record<string, any> = {};

        arr.forEach((t: any) => {
            if (allowCache !== false) {
                this.ticketsCache[t.key.toUpperCase()] = t;
            }
            if (!asArr) {
                result[t.key] = t;
            }
        });

        if (onlyOne) {
            return arr[0];
        }

        return asArr ? arr : result;
    }

    /**
     * Internal method to fetch ticket details with caching
     */
    private async fetchTicketDetails(tickets: string[], fields: string[], opts?: any): Promise<any[]> {
        const result: any[] = [];
        const toFetch: string[] = [];
        const uniqueTickets = distinct(tickets, (t: any) => t);

        uniqueTickets.forEach((t: any) => {
            const cached = this.ticketsCache[t];
            if (!cached) {
                toFetch.push(t);
            } else {
                result.push(cached);
            }
        });

        if (toFetch.length > 0) {
            const jql = `key in ('${toFetch.join('\', \'')}')`;
            try {
                const list = await this.$jira.searchTickets(jql, fields, undefined, opts);
                result.push(...list);
            } catch (err) {
                console.error('Error fetching tickets:', err);
            }
        }

        return result;
    }

    //#region New Import Functions

    /**
     * Pull project metadata for import
     */
    async pullProjectMetadata(projectListToPull: string[]): Promise<boolean> {
        const metadata = await this.$jira.getProjectImportMetadata(projectListToPull);
        if (this.projectImportMetadata) {
            this.projectImportMetadata = { ...this.projectImportMetadata, ...metadata };
        } else {
            this.projectImportMetadata = metadata;
        }
        return !!Object.keys(metadata).length;
    }

    /**
     * Validate issues for import
     */
    async validateIssuesForImport(
        data: { columns: Column[]; importData: Issue[]; addedFields: Record<string, boolean> },
        settings?: any,
    ): Promise<{ columns: Column[]; importData: Issue[]; addedFields: Record<string, boolean> }> {
        const { columns, importData: issues, addedFields } = data;

        await this.pullProjectMetadata(distinct(issues, (i: any) => i.project?.value, true));

        const importData = await mapAsync(issues, (issue) => this.validateIssueForImport(issue, columns, addedFields, true, settings));

        await this.fillIssueDetails(importData, columns);

        await mapAsync(importData, async (issue) => {
            const { issuekey, importStatus } = issue;
            const isInsert = !issuekey.value;
            const metadata = isInsert ? importStatus!.createMetadata : importStatus!.updateMetadata;

            if (metadata) {
                importStatus!.hasError =
                    !(await this.validateFieldsUsingMetadata(issue, columns, metadata.fields, addedFields, isInsert)) ||
                    importStatus!.hasError;
            }

            issue.disabled = importStatus!.hasError;
            if (issue.disabled) {
                issue.selected = false;
            }
        });

        return { columns, importData, addedFields };
    }

    /**
     * Fill issue details from Jira
     */
    async fillIssueDetails(issues: Issue[], columns: Column[]): Promise<void> {
        const issueKeys = distinct(issues, (i: any) => i.issuekey?.value, true);
        const filteredCols = columns.filter((c: any) => !c.hasError && ignoredFields.indexOf(c.field) === -1);
        const colNames = filteredCols.map((c: any) => c.field);

        const jiraIssues = await this.getTicketDetails(issueKeys, false, colNames, {
            ignoreErrors: true,
            ignoreWarnings: true,
        });

        issues.forEach((issue) => {
            const key = issue.issuekey.value;
            if (!key || issue.issuekey.error) return;

            const jiraIssue = jiraIssues[key];
            if (!jiraIssue) {
                issue.issuekey.error = msgValueInvalid;
                issue.importStatus!.hasError = true;
                return;
            }

            const fields = jiraIssue.fields;
            filteredCols.forEach((col) => {
                const { field } = col;
                const curValue = fields[field];
                if (!issue[field]) issue[field] = {};
                this.setJiraValue(issue, col, curValue);
            });
        });
    }

    /**
     * Set Jira value on issue field
     */
    setJiraValue(issue: Issue, col: Column, jiraValue: any): void {
        const { field, fieldType } = col;
        if (field === 'issuekey') return;

        const valueObj = issue[field] as ValueObj;
        if (!jiraValue) {
            delete valueObj.jiraValue;
            return;
        }

        valueObj.jiraValue = {};

        if (field === 'parent') {
            valueObj.jiraValue = jiraValue.key;
            if (valueObj.value && compareIgnoreCase(valueObj.value, valueObj.jiraValue)) {
                delete valueObj.value;
            }
        } else if (fieldType === 'user') {
            this.setUserValueObj(valueObj.jiraValue, jiraValue);
            this.clearUserIfUnchanged(valueObj, jiraValue);
        } else if (Array.isArray(jiraValue)) {
            const val: any[] = [];
            valueObj.jiraValue.value = val;
            jiraValue.forEach((jv) => {
                if (typeof jv === 'object') {
                    const item: any = {};
                    val.push(item);
                    this.setKnownValueObj(item, jv);
                } else {
                    val.push({ value: jv });
                }
            });
        } else if (typeof jiraValue === 'object') {
            this.setKnownValueObj(valueObj.jiraValue, jiraValue);
            this.clearValueIfUnchanged(valueObj, jiraValue);
        } else {
            valueObj.jiraValue = { value: jiraValue };
            if (valueObj.value === jiraValue) {
                delete valueObj.value;
                delete valueObj.displayText;
                delete valueObj.avatarUrl;
            }
        }
    }

    /**
     * Clear value if unchanged from Jira
     */
    clearValueIfUnchanged(valueObj: ValueObj, jiraValue: any): void {
        const { value } = valueObj;
        if (!value) return;

        if (!Array.isArray(value)) {
            const toCompare = prepareForCompare(value);
            if (
                toCompare === jiraValue.id ||
                toCompare === prepareForCompare(jiraValue.key) ||
                toCompare === prepareForCompare(jiraValue.name)
            ) {
                delete valueObj.value;
                delete valueObj.displayText;
                delete valueObj.avatarUrl;
            }
        }
    }

    /**
     * Clear user value if unchanged
     */
    clearUserIfUnchanged(valueObj: ValueObj, jiraValue: any): void {
        const { value } = valueObj;
        if (!value) return;

        const toCompare = prepareForCompare(value);
        if (
            toCompare === jiraValue.id ||
            toCompare === prepareForCompare(jiraValue.key) ||
            toCompare === prepareForCompare(jiraValue.name) ||
            toCompare === prepareForCompare(jiraValue.emailAddress) ||
            toCompare === prepareForCompare(jiraValue.accountId) ||
            toCompare === prepareForCompare(jiraValue.displayName)
        ) {
            delete valueObj.value;
            delete valueObj.displayText;
            delete valueObj.avatarUrl;
        }
    }

    /**
     * Validate issue for import (create or update)
     */
    async validateIssueForImport(
        issue: Issue,
        columns: Column[],
        addedFields: Record<string, boolean>,
        isBulk: boolean,
        settings?: any,
    ): Promise<Issue> {
        issue = { ...issue };

        const actions: Record<string, boolean> = {};
        const importStatus: ImportStatus = { hasError: false, actions };
        issue.importStatus = importStatus;

        if (issue.issuekey.value) {
            if (issue.delete) {
                actions.delete = true;
                return issue;
            } else if (issue.clone) {
                actions.clone = true;
            }

            await this.validateIssueForUpdate(issue, columns, addedFields, isBulk, settings);
        } else {
            actions.create = true;
            await this.validateIssueForCreate(issue, columns, addedFields, isBulk, settings);
        }

        return issue;
    }

    /**
     * Validate issue for update
     */
    async validateIssueForUpdate(
        issue: Issue,
        columns: Column[],
        addedFields: Record<string, boolean>,
        isBulk: boolean,
        settings?: any,
    ): Promise<void> {
        const { issuekey, importStatus } = issue;
        let issueMetadata = (issue as any).updateMetadata;

        if (!issueMetadata) {
            try {
                issueMetadata = await this.$jira.getIssueMetadata(issuekey.value);
            } catch {
                issuekey.error = msgValueInvalid;
                importStatus!.hasError = true;
                return;
            }
        }

        const { fields } = issueMetadata;
        let fieldsArr = issueMetadata.fieldsArr;
        if (!fieldsArr) {
            fieldsArr = Object.keys(fields).map((f: any) => fields[f]);
            issueMetadata.fieldsArr = fieldsArr;
        }
        this.addMissingColumns(columns, addedFields, fieldsArr, settings);
        importStatus!.updateMetadata = issueMetadata;
    }

    /**
     * Validate issue for create
     */
    async validateIssueForCreate(
        issue: Issue,
        columns: Column[],
        addedFields: Record<string, boolean>,
        isBulk: boolean,
        settings?: any,
    ): Promise<void> {
        const { importStatus, project, parent, issuetype } = issue;

        delete project.error;
        delete project.warning;

        if (!project.value) {
            project.error = msgValueRequired;
        } else if (!this.projectImportMetadata[project.value]) {
            if (isBulk || !(await this.pullProjectMetadata([project.value]))) {
                project.error = msgValueInvalid;
            }
        }

        delete issuetype.error;
        delete issuetype.warning;

        if (!issuetype.value) {
            issuetype.error = msgValueRequired;
        } else if (!project.error) {
            const projectMetadata = this.projectImportMetadata[project.value];
            const typeKey = issuetype.value.toLowerCase().replace(/ /g, '-');
            const typeObj = projectMetadata.issuetypesObj[typeKey];

            if (typeObj) {
                issue.issuetype.value = typeObj.name;
                issue.issuetype.displayText = typeObj.name;
                issue.issuetype.avatarUrl = typeObj.iconUrl;

                if (parent.value && !typeObj.subtask) {
                    issuetype.error = 'Must be a subtask';
                } else if (!parent.value && typeObj.subtask) {
                    issuetype.error = 'Must not be a subtask';
                }

                if (!typeObj.fieldsArr) {
                    typeObj.fieldsArr = Object.keys(typeObj.fields).map((f: any) => typeObj.fields[f]);
                }
                this.addMissingColumns(columns, addedFields, typeObj.fieldsArr, settings);
                importStatus!.createMetadata = typeObj;
            } else {
                issuetype.error = msgValueInvalid;
            }
        }

        importStatus!.hasError = importStatus!.hasError || !!project.error || !!parent.error || !!issuetype.error;
    }

    /**
     * Add missing required columns
     */
    addMissingColumns(columns: Column[], addedFields: Record<string, boolean>, fields: any[], settings?: any): void {
        fields.forEach((col) => {
            if (col.required && !addedFields[col.key]) {
                addedFields[col.key] = true;
                columns.push({
                    field: col.key,
                    displayText: col.name,
                    fieldType: this.getFieldType(col),
                    custom: !!col.schema?.customId,
                    headerEditable: false,
                    ...settings,
                });
            }
        });
    }

    /**
     * Get field type from schema
     */
    getFieldType(col: any): string {
        const { schema: { type, system } = {} } = col;
        return type === 'array' ? system : type;
    }

    /**
     * Validate fields using metadata
     */
    async validateFieldsUsingMetadata(
        issue: Issue,
        columns: Column[],
        fields: any,
        addedFields: Record<string, boolean>,
        insert: boolean,
    ): Promise<boolean> {
        let isValid = true;
        const hasIssueKey = !!issue.issuekey.value;

        await mapAsync(columns, async (col) => {
            if (ignoredFields.indexOf(col.field) !== -1) return;

            const field = fields[col.field];
            const valueObj = (issue[col.field] || {}) as ValueObj;

            if (!field) {
                if (valueObj.value) {
                    if (insert) {
                        valueObj.warning = msgInvalidForCreation;
                    } else {
                        valueObj.error = 'Field not allowed for update';
                    }
                    issue[col.field] = valueObj;
                    isValid = isValid && !valueObj.error;
                }
                return;
            }

            const { key, required, autoCompleteUrl, allowedValues, schema } = field;

            if (key === 'issuetype') return;

            const value = valueObj.value;

            delete valueObj.error;

            if (required && !value && (!hasIssueKey || valueObj.delete)) {
                issue[key] = valueObj;
                valueObj.error = msgValueRequired;
            }

            if (addedFields[key]) {
                if (allowedValues) {
                    valueObj.allowedValues = allowedValues;
                } else if (autoCompleteUrl) {
                    valueObj.autoCompleteUrl = autoCompleteUrl;
                    issue[key] = valueObj;
                }

                if (schema.type === 'array') {
                    issue[key] = valueObj;
                    valueObj.isArray = true;

                    if (value && !Array.isArray(value)) {
                        valueObj.value = distinct(
                            value.split(/[;,]/g).filter((v: string) => v.trim()),
                            (v: string) => v,
                        ).map((v: string) => ({ value: v.trim() }));
                    }
                }

                if (value) {
                    this.verifyAllowedValues(allowedValues, valueObj);
                    await this.validateFieldType(schema, valueObj);
                }
            }

            isValid = isValid && !valueObj.error;
        });

        return isValid;
    }

    /**
     * Verify allowed values
     */
    verifyAllowedValues(allowedValues: any[], valueObj: ValueObj): boolean {
        delete valueObj.error;

        if (allowedValues && valueObj) {
            valueObj.allowedValues = allowedValues;
            const { value } = valueObj;

            if (Array.isArray(value)) {
                let isValid = true;
                value.forEach((val: any) => {
                    if (!this.verifyAllowedValues(allowedValues, val)) {
                        valueObj.error = 'One or more item is invalid';
                        isValid = false;
                    }
                });
                return isValid;
            } else {
                const valueItem = this.getField(value, allowedValues);
                if (valueItem) {
                    this.setKnownValueObj(valueObj, valueItem);
                    return true;
                } else {
                    valueObj.error = msgValueInvalid;
                    return false;
                }
            }
        }

        return !valueObj.error;
    }

    /**
     * Validate field type
     */
    async validateFieldType(schema: any, valueObj: ValueObj): Promise<void> {
        if (!valueObj?.value) return;

        const value = valueObj.value;
        const { type } = schema || {};
        let isValid: boolean;

        switch (type) {
            case 'string':
                isValid = typeof value === type;
                break;
            case 'date':
            case 'datetime':
                isValid = this.validateFieldType_Date(valueObj, value, type);
                break;
            case 'array':
                isValid = true;
                break;
            case 'user':
                isValid = await this.validateFieldType_User(valueObj, value);
                break;
            case 'issuelink':
                isValid = await this.validateFieldType_IssueLink(valueObj, value);
                break;
            default:
                isValid = true;
                break;
        }

        if (!isValid) {
            valueObj.error = msgValueInvalid;
        }
    }

    /**
     * Validate date field type
     */
    validateFieldType_Date(valueObj: ValueObj, value: any, type: string): boolean {
        const dateObj = this.$utils.convertDate(value);
        if (dateObj) {
            valueObj.value = dateObj;
            const { formatDateTime, formatDate } = this.$userutils;
            valueObj.displayText = type === 'datetime' ? formatDateTime(dateObj) : formatDate(dateObj);
            return true;
        }
        return false;
    }

    /**
     * Validate user field type
     */
    async validateFieldType_User(valueObj: ValueObj, value: any): Promise<boolean> {
        if (!value) return true;

        const user = await this.getUserObject(value);
        if (user) {
            this.setUserValueObj(valueObj, user);
            return true;
        }
        return false;
    }

    /**
     * Set user value object
     */
    setUserValueObj(valueObj: ValueObj, user: any): void {
        valueObj.value = user.emailAddress || user.name || user.accountId || valueObj.value;
        valueObj.displayText = user.displayName;
        const { avatarUrls } = user;
        const avt = avatarUrls && (avatarUrls['24x24'] || avatarUrls['32x32'] || avatarUrls['48x48'] || avatarUrls['16x16']);
        if (avt) {
            valueObj.avatarUrl = avt;
        }
    }

    /**
     * Set known value object
     */
    setKnownValueObj(valueObj: ValueObj | any, valueItem: any): void {
        valueObj.displayText = valueItem.name || valueItem.value;
        valueObj.value = valueItem.key || valueItem.id || valueItem.name || valueItem.value;

        let iconUrl = valueItem.iconUrl;
        if (!iconUrl) {
            const { avatarUrls } = valueItem;
            iconUrl = avatarUrls && (avatarUrls['24x24'] || avatarUrls['32x32'] || avatarUrls['48x48'] || avatarUrls['16x16']);
        }

        if (iconUrl) {
            valueObj.avatarUrl = iconUrl;
        }
    }

    /**
     * Validate issue link field type
     */
    async validateFieldType_IssueLink(valueObj: ValueObj, value: any): Promise<boolean> {
        const issueLink = await this.searchIssueForPicker(value);
        if (issueLink) {
            valueObj.value = issueLink.key;
            valueObj.displayText = `${issueLink.key}: ${issueLink.summary}`;
            return true;
        }
        return false;
    }

    /**
     * Get field from allowed values
     */
    getField(value: any, allowedValues: any[]): any {
        const strForCompare = prepareForCompare(value);
        return allowedValues.find(
            (v: any) =>
                v.id === value ||
                prepareForCompare(v.key) === strForCompare ||
                prepareForCompare(v.name) === strForCompare ||
                prepareForCompare(v.value) === strForCompare,
        );
    }

    /**
     * Get user object
     */
    async getUserObject(value: string): Promise<any> {
        const users = await this.$jira.searchUsers(value);
        if (users.length > 1) {
            const filteredUsers = users.filter(
                (u: any) =>
                    compareIgnoreCase(u.accountId, value) ||
                    compareIgnoreCase(u.emailAddress, value) ||
                    compareIgnoreCase(u.displayName, value) ||
                    compareIgnoreCase(u.name, value),
            );

            if (filteredUsers.length) {
                return filteredUsers[0];
            }
        }

        return users[0];
    }

    /**
     * Search issue for picker
     */
    async searchIssueForPicker(query: string): Promise<any> {
        let issues = await this.$jira.searchIssueForPicker(query, { currentJQL: '' });
        if (issues.length > 1) {
            const key = prepareForCompare(query);
            issues = issues.filter((issue: any) => prepareForCompare(issue.key) === key);
        }
        return issues[0];
    }

    /**
     * Import issue (create, update, clone, or delete)
     */
    async importIssue(issue: Issue, columns: Column[], addedFields: Record<string, boolean>): Promise<Issue | undefined> {
        const { issuekey, clone, delete: deleteIssue, importStatus } = issue;

        if (deleteIssue) {
            try {
                await this.$jira.deleteIssue(issuekey.value);
                importStatus!.imported = true;
                issue.disabled = true;
                delete issue.selected;
            } catch (err: any) {
                importStatus!.hasError = true;
                const msg = err.response || 'Check console for error details';
                importStatus!.error = `Error: ${err.status}, ${msg.length < 50 ? msg : 'Check console for error details'}`;
                console.error('Delete Error: Key:-', issuekey.value, ' Error Details:-', err);
            }
            return;
        } else if (clone) {
            try {
                const summary = issue.summary.value || issue.summary.jiraValue;
                const response = await this.$jira.cloneIssue(issuekey.value, summary);
                issue.summary.jiraValue = summary;
                importStatus!.imported = true;
                issue.disabled = true;
                delete issue.selected;
                delete issue.clone;
                delete issue.summary.value;

                if (response.key) {
                    issuekey.value = response.key;
                } else {
                    console.log(issuekey.value, ' cloning is Queued. Task Details:-', response);
                    importStatus!.hasWarning = true;
                    importStatus!.warning = 'Cloning is queued in Jira. Check Jira Issue for status.';
                    return;
                }
            } catch (err: any) {
                importStatus!.hasError = true;
                const msg = err.response || 'Check console for error details';
                importStatus!.error = `Error: ${err.status}, ${msg.length < 50 ? msg : 'Check console for error details'}`;
                console.error('Clone Error: Key:-', issuekey.value, ' Error Details:-', err);
            }
        }

        let hasFieldsForUpdate = !!issuekey.value;

        // Create issue
        if (!issuekey.value) {
            const { fields, pending } = this.getFieldsForImport(issue, columns, importStatus!.createMetadata.fields);

            try {
                const response = await this.$jira.createIssue(fields);
                const { key } = response;

                if (key) {
                    issuekey.value = key;
                    hasFieldsForUpdate = !!pending.length;
                    importStatus!.imported = true;
                    issue.disabled = true;
                    delete issue.selected;
                    delete importStatus!.hasWarning;
                    delete importStatus!.warning;
                }

                console.log('Issue created', response);

                // Clear the fields which are already imported
                Object.keys(fields).forEach((f: any) => {
                    const { displayText, value, avatarUrl } = issue[f] as ValueObj;
                    (issue[f] as ValueObj).jiraValue = { displayText, value, avatarUrl };
                    delete (issue[f] as ValueObj).value;
                    delete (issue[f] as ValueObj).displayText;
                    delete (issue[f] as ValueObj).avatarUrl;
                });

                if (hasFieldsForUpdate) {
                    try {
                        const metadata = await this.$jira.getIssueMetadata(issuekey.value);
                        importStatus!.updateMetadata = metadata;
                        const isValidForUpdate = await this.validateFieldsUsingMetadata(
                            issue,
                            columns,
                            metadata.fields,
                            addedFields,
                            false,
                        );
                        if (!isValidForUpdate) {
                            importStatus!.hasError = true;
                            hasFieldsForUpdate = false;
                        }
                    } catch (err: any) {
                        importStatus!.hasError = true;
                        importStatus!.error = `Update Error: ${err.status}, ${
                            err.response?.length < 50 ? err.response : 'Check console for error details'
                        }`;
                        console.error('Error pulling update metadata: Fields:-', fields, ' Error Details:-', err);
                    }
                }
            } catch (err: any) {
                importStatus!.hasError = true;
                importStatus!.error = `Error: ${err.status}, ${
                    err.response?.length < 50 ? err.response : 'Check console for error details'
                }`;
                console.error('Import Error: Key:-', issuekey.value, ' Error Details:-', err);
            }
        }

        // Update issue
        if (issuekey.value && hasFieldsForUpdate && importStatus!.updateMetadata) {
            const { fields, pending } = this.getFieldsForImport(issue, columns, importStatus!.updateMetadata.fields);

            try {
                if (Object.keys(fields).length) {
                    const response = await this.$jira.updateIssue(issuekey.value, { fields });
                    console.log('Issue updated', response);

                    importStatus!.imported = true;
                    issue.disabled = true;
                    delete issue.selected;
                    delete importStatus!.hasWarning;
                    delete importStatus!.warning;

                    // Clear the fields which are already imported
                    Object.keys(fields).forEach((f: any) => {
                        const { displayText, value, avatarUrl } = issue[f] as ValueObj;
                        (issue[f] as ValueObj).jiraValue = { displayText, value, avatarUrl };
                        delete (issue[f] as ValueObj).value;
                        delete (issue[f] as ValueObj).displayText;
                        delete (issue[f] as ValueObj).avatarUrl;
                    });
                }

                if (pending.length) {
                    importStatus!.hasWarning = true;
                    importStatus!.warning = `Following fields not imported: ${pending.join()}`;
                }
            } catch (err: any) {
                importStatus!.hasError = true;
                importStatus!.error = `Error: ${err.status}, ${
                    err.response?.length < 50 ? err.response : 'Check console for error details'
                }`;
                console.error('Update Error: Key:-', issuekey.value, 'Fields:-', fields, ' Error Details:-', err);
            }
        }

        return issue;
    }

    /**
     * Get fields for import
     */
    getFieldsForImport(issue: Issue, columns: Column[], fields: any): { fields: any; pending: string[] } {
        const result: any = {};
        const pending: string[] = [];

        columns.forEach((col) => {
            const { field } = col;
            const valueObj = issue[field] as ValueObj;

            if (!valueObj?.value) return;

            const jiraField = fields[field];
            if (jiraField) {
                const value = this.getFieldValueForImport(valueObj.value, jiraField);
                result[field] = value;
            } else {
                pending.push(field);
            }
        });

        return { fields: result, pending };
    }

    /**
     * Get field value for import
     */
    getFieldValueForImport(value: any, field: any): any {
        const {
            schema: { type, items },
            allowedValues,
        } = field;
        let returnValue: any = null;

        switch (type) {
            case 'user':
                returnValue = { name: value };
                break;
            case 'date':
                returnValue = this.$utils.formatDateTimeForJira(value);
                break;
            case 'array':
                returnValue = value.map((v: any) => {
                    v = v.value;
                    const val: any = {};

                    if (items === 'string') return v;

                    let fieldName: string | null = null;

                    if (allowedValues) {
                        const cVal = prepareForCompare(v);
                        for (let i = 0; i < allowedValues.length; i++) {
                            const { id, key, name } = allowedValues[i];

                            if (key && cVal === prepareForCompare(key)) {
                                fieldName = 'key';
                                v = key;
                            } else if (name && cVal === prepareForCompare(name)) {
                                fieldName = 'name';
                                v = name;
                            } else if (v === id) {
                                fieldName = 'id';
                                v = id;
                            } else {
                                continue;
                            }

                            break;
                        }
                    } else {
                        if (isNaN(v)) {
                            fieldName = 'key';
                        } else {
                            fieldName = 'id';
                        }
                    }

                    val[fieldName!] = v;

                    return val;
                });
                break;
            case 'string':
                returnValue = value;
                break;
            case 'timetracking':
                returnValue = value;
                break;
            default: {
                const val: any = {};
                let fieldName: string | null = null;

                if (isNaN(value)) {
                    fieldName = 'key';
                } else {
                    fieldName = 'id';
                }

                if (allowedValues) {
                    for (let i = 0; i < allowedValues.length; i++) {
                        const { id, key, name } = allowedValues[i];

                        if (value === key) {
                            fieldName = 'key';
                        } else if (value === name) {
                            fieldName = 'name';
                        } else if (value === id) {
                            fieldName = 'id';
                        } else {
                            continue;
                        }

                        break;
                    }
                }

                if (fieldName) {
                    val[fieldName] = value;
                }

                returnValue = val;
                break;
            }
        }

        return returnValue;
    }

    //#endregion

    //#region Old Import Functions - For backward compatibility

    /**
     * Process issues for import (old method)
     */
    async processIssuesForImport(issues: any[]): Promise<any> {
        issues = repeatIssuesWithMultiValues(issues);

        const importData = issues.map(prepareParentAndProjectFields);
        const projectListToPull = distinct(importData, (i: any) => i.project, true);

        const metadata = await this.$jira.getProjectImportMetadata(projectListToPull);

        const issueKeys = distinct(importData, (i: any) => i.issuekey || null, true);
        const ticketDetails = await this.getTicketDetails(issueKeys, false);

        const importFields = await this.getFieldsToImport(metadata, issues);

        const processedIssues = await mapAsync(importData, async (issue: any) => {
            const ticketFields = issue.issuekey && ticketDetails && (ticketDetails[issue.issuekey] || {}).fields;
            return await this.prepareIssue(issue, metadata, importFields, ticketFields);
        });

        return { importFields, metadata, importData: processedIssues, ticketDetails };
    }

    /**
     * Prepare issue (old method)
     */
    async prepareIssue(issue: any, metadata: any, importFields: any[], ticketFields: any): Promise<any> {
        const result = await this.validateBasicFields(issue, metadata, ticketFields);

        const { raw, options, fields, issuetype } = result;

        let hasError = this.validateCrossFields(raw, options, issuetype) || result.hasError;

        const importFieldKeys = Object.keys(fields);
        await mapAsync(importFieldKeys, async (f: string) => {
            const fieldMetadata = fields[f];

            const fieldOption = this.getOptionField(options, f);

            await this.prepareField(f, fieldMetadata, raw, fieldOption, issuetype, ticketFields);

            if (!hasError) {
                hasError = fieldOption.errors.length > 0;
            }
        });

        if (importFieldKeys.length > 0) {
            Object.keys(raw).forEach((f: string) => {
                const fieldOption = this.getOptionField(options, f, true);
                const importValue = this.assignExistingValuesWhenEmpty(f, raw, fieldOption, ticketFields);

                if ((fields[f] || f === 'issuekey') && importValue) {
                    return;
                }

                const fieldMetadata = first(importFields, (cf: any) => cf.key === f);

                fieldOption.displayValue = importValue;

                if (fieldMetadata) {
                    if (raw.issuekey) {
                        if (this.isValueChanged(f, raw, ticketFields)) {
                            fieldOption.errors.push('This field is not editable');
                            hasError = true;
                        }
                    } else {
                        fieldOption.warnings.push(msgInvalidForCreation);
                    }
                } else {
                    fieldOption.errors.push('This is not a known field');
                    hasError = true;
                }
            });
        }

        if (hasError) {
            result.hasError = hasError;
            result.status = 'Error';
        } else {
            result.status = `Will Import (${raw.issuekey ? 'update' : 'new'})`;
        }

        return result;
    }

    /**
     * Validate basic fields
     */
    async validateBasicFields(raw: any, metadata: any, ticketFields?: any): Promise<any> {
        const options: any = { project: { errors: [] }, issuetype: { errors: [] } };

        const project = this.assignExistingValuesWhenEmpty('project', raw, options.project, ticketFields);
        const issuetype = this.assignExistingValuesWhenEmpty('issuetype', raw, options.issuetype, ticketFields);

        let hasError = false;

        if (!project) {
            options.project.errors.push('Value is required');
            hasError = true;
        } else {
            options.project.displayValue = project;
        }

        if (!issuetype) {
            options.issuetype.errors.push('Value is required');
            hasError = true;
        } else {
            options.issuetype.displayValue = issuetype;
        }

        let fields: any = {};

        try {
            if (raw.issuekey) {
                fields = await this.$jira.getIssueMetadata(raw.issuekey);
            }
        } catch (err: any) {
            const { error: { errorMessages = [] } = {} } = err;
            const issuekeyOption = this.getOptionField(options, 'issuekey');
            issuekeyOption.errors = errorMessages;
            hasError = true;
        }

        let projectMetadata = project && metadata[project];

        if (projectMetadata) {
            raw.project = projectMetadata.key;
            options.project.displayValue = projectMetadata.name;
        } else if (project) {
            options.project.errors.push('Value is invalid');
            hasError = true;
        }

        let currentIssueType: any;

        if (raw.issuekey) {
            if (projectMetadata) {
                projectMetadata = { ...projectMetadata, fields };
            }
        } else {
            const { issuetypes } = projectMetadata || { issuetypes: [] };
            const issuetypeForSearch = prepareForCompare(issuetype);

            currentIssueType = issuetypeForSearch && issuetypes.find((it: any) => prepareForCompare(it.name) === issuetypeForSearch);

            if (currentIssueType) {
                raw.issuetype = currentIssueType.name;
                options.issuetype.displayValue = currentIssueType.name;
                fields = currentIssueType.fields;
            } else if (issuetype) {
                options.issuetype.errors.push('Value is invalid');
                hasError = true;
            }
        }

        return { raw, options, fields, issuetype: currentIssueType, project: projectMetadata, hasError };
    }

    /**
     * Assign existing values when empty
     */
    assignExistingValuesWhenEmpty(field: string, issue: any, option: any, ticketFields?: any): string {
        let value = (issue[field] || '').trim();

        const setValueToNull = value.toLowerCase() === 'null';
        if (setValueToNull) {
            value = '';
            issue[field] = '';
        }

        const existingValue = ticketFields && ticketFields[field];

        if (existingValue && !value && !setValueToNull) {
            if (typeof existingValue === 'object') {
                value = existingValue.name || existingValue.id;
            } else {
                value = existingValue;
            }

            issue[field] = value;
            option.displayValue = value;
        }

        return value;
    }

    /**
     * Check if value changed
     */
    isValueChanged(field: string, issue: any, ticketFields: any): boolean {
        const value = (issue[field] || '').trim().toLowerCase();
        const existingValue = ticketFields && ticketFields[field];

        if (existingValue) {
            if (typeof existingValue === 'object') {
                return existingValue.id != value && (existingValue.name || '').toLowerCase() !== value;
            } else {
                return `${existingValue}`.toLowerCase() !== value;
            }
        }

        return false;
    }

    /**
     * Get option field
     */
    getOptionField(options: any, field: string, includeWarning?: boolean): any {
        const fieldOption = options[field] || { errors: [] };
        options[field] = fieldOption;
        if (includeWarning) {
            fieldOption.warnings = [];
        }
        return fieldOption;
    }

    /**
     * Validate cross fields
     */
    validateCrossFields(raw: any, options: any, issuetype: any): boolean {
        if (!issuetype) return true;

        const { subtask } = issuetype;
        const parentOption = this.getOptionField(options, 'parent');
        const issuetypeOption = this.getOptionField(options, 'issuetype');

        let hasError = false;

        if (raw.parent && !subtask) {
            parentOption.errors.push('Value is invalid for this issue type');
            issuetypeOption.errors.push('This is not a valid sub task type');
            hasError = true;
        }

        if (subtask && !raw.parent) {
            issuetypeOption.errors.push('Subtask is not valid without parent');
            hasError = true;
        }

        return hasError;
    }

    /**
     * Prepare field for import
     */
    async prepareField(field: string, metadata: any, issue: any, option: any, issuetype: any, ticketFields?: any): Promise<void> {
        const { required, schema, allowedValues } = metadata;
        const value = this.assignExistingValuesWhenEmpty(field, issue, option, ticketFields);

        if (required && !value) {
            option.errors.push('Value is required');
        }

        if (!option.displayValue && value) {
            option.displayValue = value;
        }

        await this.validateType(schema, value, option);
        this.validateAllowedValues(issue, field, allowedValues, value, option);
    }

    /**
     * Validate allowed values for old import
     */
    validateAllowedValues(issue: any, field: string, allowedValues: any[], value: any, option: any): void {
        if (allowedValues && value) {
            const valueItem = this.getField(value, allowedValues);
            if (valueItem) {
                option.displayValue = valueItem.name || valueItem.value;
                issue[field] = valueItem.id || valueItem.key || valueItem.name || valueItem.value;
            } else {
                option.errors.push('Invalid value for this field');
            }
        }
    }

    /**
     * Validate type for old import
     */
    async validateType(schema: any, value: any, option: any): Promise<void> {
        if (!value) return;

        const { type } = schema || {};
        let isValid: boolean;

        switch (type) {
            case 'string':
                isValid = typeof value === type;
                break;
            case 'array':
                isValid = true;
                break;
            case 'user':
                isValid = true;
                await this.validateIfValidUser(value, option);
                break;
            default:
                isValid = true;
                break;
        }

        if (!isValid) {
            option.errors.push('Invalid value for this field');
        }
    }

    /**
     * Validate if valid user
     */
    async validateIfValidUser(value: string, option: any): Promise<void> {
        try {
            const u = await this.getUserObject(value);
            option.displayValue = u.displayName;
        } catch (e) {
            option.errors.push('Not a valid jira user name');
        }
    }

    /**
     * Get fields to import
     */
    async getFieldsToImport(metadata: any, rawissues: any[]): Promise<any[]> {
        const refFields: Record<string, boolean> = {};
        const importFields: any[] = [];

        const allProjects = Object.keys(metadata);

        allProjects.forEach((pKey) => {
            const project = metadata[pKey];
            const { issuetypes } = project;

            issuetypes.forEach((iType: any) => {
                const { fields } = iType;
                const fieldList = Object.keys(fields);

                fieldList
                    .filter((f: any) => !refFields[f])
                    .forEach((key) => {
                        refFields[key] = true;
                        const { required, name } = fields[key];
                        importFields.push({ key, required, name });
                    });
            });
        });

        refFields.issuekey = true;

        const remainingFields = Object.keys(rawissues[0] || {}).filter((f: any) => !refFields[f]);
        if (remainingFields && remainingFields.length > 0) {
            const jiraFieldList = await this.$jira.getCustomFields();

            remainingFields.forEach((key) => {
                const field = first(jiraFieldList, (jf: any) => jf.id === key);
                if (field) {
                    importFields.push({ key, name: field.name, jiraField: field });
                } else {
                    importFields.push({ key, name: key, unknown: true });
                }
            });
        }

        return importFields;
    }

    /**
     * Import issues in bulk
     */
    async importIssues(importData: any[]): Promise<any> {
        importData = [...importData];

        const importableData = await this.prepareIssuesForImport(importData);
        const issuesToImport = importableData.map((i: any) => ({ fields: i.fields }));

        const result = await this.$jira
            .bulkImportIssues(issuesToImport)
            .then(null, (err: any) => err.error)
            .then((result: any) => {
                const { errors, issues, errorMessages } = result;

                let hasIndividualStatus = false;
                const itemsWithErrors: number[] = [];

                if (errors && errors.length > 0) {
                    errors.forEach((e: any) => {
                        const {
                            failedElementNumber,
                            elementErrors: { errors: itemErrors, errorMessages },
                        } = e;

                        itemsWithErrors.push(failedElementNumber);

                        const importItem = { ...importData[failedElementNumber] };
                        importData[failedElementNumber] = importItem;

                        const { options } = importItem;

                        Object.keys(itemErrors).forEach((field) => {
                            const option = this.getOptionField(options, field);
                            option.errors.push(itemErrors[field]);
                        });

                        if (errorMessages && errorMessages.length) {
                            if (!importItem.statusErrors) {
                                importItem.statusErrors = [];
                            }
                            importItem.statusErrors.push(...errorMessages);
                        }

                        importItem.hasError = true;
                        importItem.status = 'Import Error';
                    });

                    hasIndividualStatus = true;
                }

                if (issues && issues.length > 0) {
                    let curItem = -1;
                    for (let i = 0; i < importData.length; i++) {
                        if (!itemsWithErrors.includes(i)) {
                            let issue = importData[i];
                            issue = { ...issue };
                            curItem++;
                            issue.raw.issuekey = issues[curItem].key;
                            issue.status = 'Imported';
                            issue.disabled = true;
                            issue.selected = false;
                            importData[i] = issue;
                        }
                    }

                    hasIndividualStatus = true;
                }

                if (hasIndividualStatus) {
                    return importData;
                } else {
                    return Promise.reject(errorMessages);
                }
            });

        return result;
    }

    /**
     * Prepare issues for import
     */
    async prepareIssuesForImport(importData: any[]): Promise<any[]> {
        let fieldsFromJira: any = await this.$jira.getCustomFields();

        fieldsFromJira = fieldsFromJira.reduce((obj: any, f: any) => {
            obj[f.id] = f;
            return obj;
        }, {});

        return importData.map((issue) => {
            const { fields: metadata, raw } = issue;
            const fieldsWithValue = Object.keys(raw).filter((k: any) => !!raw[k]);

            const update: any = {};
            let needsUpdate = false;

            const fields = fieldsWithValue.reduce((obj: any, f) => {
                if (f.indexOf('.') >= 0) {
                    const split = f.split('.');
                    const value = this.getValueForImport(raw[f], metadata[split[0]] || fieldsFromJira[split[0]]);

                    if (metadata[split[0]]) {
                        obj[split[0]] = obj[split[0]] || {};
                        obj[split[0]][split[1]] = value;
                    } else {
                        update[split[0]] = update[split[0]] || {};
                        update[split[0]][split[1]] = value;
                        needsUpdate = true;
                    }
                } else {
                    const value = this.getValueForImport(raw[f], metadata[f] || fieldsFromJira[f]);

                    if (metadata[f]) {
                        obj[f] = value;
                    } else {
                        update[f] = value;
                        needsUpdate = true;
                    }
                }

                return obj;
            }, {});

            if (needsUpdate) {
                return { fields, update };
            } else {
                return { fields };
            }
        });
    }

    /**
     * Get value for import (old method)
     */
    getValueForImport(value: any, field: any): any {
        const {
            schema: { type, items },
            allowedValues,
        } = field;
        let returnValue: any = null;

        switch (type) {
            case 'user':
                returnValue = { name: value };
                break;
            case 'date':
                returnValue = this.$utils.formatDateTimeForJira(value);
                break;
            case 'array':
                returnValue = value.split(',').map((v: string) => {
                    const val: any = {};

                    if (items === 'string') return v;

                    let fieldName: string | null = null;

                    if (allowedValues) {
                        for (let i = 0; i < allowedValues.length; i++) {
                            const { id, key, name } = allowedValues[i];

                            if (key && value === key) {
                                fieldName = 'key';
                            } else if (value === name) {
                                fieldName = 'name';
                            } else if (value === id) {
                                fieldName = 'id';
                            } else {
                                continue;
                            }

                            break;
                        }
                    } else {
                        if (isNaN(v as any)) {
                            fieldName = 'key';
                        } else {
                            fieldName = 'id';
                        }
                    }

                    val[fieldName!] = v;

                    return val;
                });
                break;
            case 'string':
                returnValue = value;
                break;
            case 'timetracking':
                returnValue = value;
                break;
            default: {
                const val: any = {};
                let fieldName: string | null = null;

                if (isNaN(value)) {
                    fieldName = 'key';
                } else {
                    fieldName = 'id';
                }

                if (allowedValues) {
                    for (let i = 0; i < allowedValues.length; i++) {
                        const { id, key, name } = allowedValues[i];

                        if (value === key) {
                            fieldName = 'key';
                        } else if (value === name) {
                            fieldName = 'name';
                        } else if (value === id) {
                            fieldName = 'id';
                        } else {
                            continue;
                        }

                        break;
                    }
                }

                val[fieldName!] = value;

                returnValue = val;
                break;
            }
        }

        return returnValue;
    }

    //#endregion
}
