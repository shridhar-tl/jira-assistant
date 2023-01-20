/* eslint-disable complexity */
import { prepareParentAndProjectFields, repeatIssuesWithMultiValues } from "../views/bulk-import/issue/data-processor";

const msgValueRequired = 'Value is required';
const msgValueInvalid = 'Invalid value for this field';
const msgInvalidForCreation = 'Not an allowed field while creation of issue. Will try to update after issue is created.';

const commonTicketFields = [
    "summary", "assignee", "reporter",
    "priority", "status", "resolution",
    "created", "updated", "issuetype", "parent"
];

const ignoredFields = ['selected', 'issuekey', 'delete', 'clone', 'importStatus'];

export default class TicketService {
    static dependencies = ["JiraService", 'MessageService', 'UtilsService', 'UserUtilsService'];

    constructor($jira, $message, $utils, $userutils) {
        this.$jira = $jira;
        this.$message = $message;
        this.$utils = $utils;
        this.$userutils = $userutils;

        this.ticketsCache = {};
    }

    getTicketDetails(tickets, asArr, ticketFields, options) {
        if (!tickets) {
            return null;
        }
        let onlyOne = false;
        if (typeof tickets === "string") {
            tickets = [tickets];
            onlyOne = true;
        }
        const { allowCache, ...opts } = options || {};

        return this.fetchTicketDetails(tickets, ticketFields || commonTicketFields, opts)
            .then((arr) => {
                const result = {};
                arr.forEach((t) => {
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
            });
    }

    async fetchTicketDetails(tickets, fields, opts) {
        const result = [];
        const toFetch = [];
        tickets = tickets.distinct(t => t);
        tickets.forEach((t) => {
            if (!this.ticketsCache[t]) {
                toFetch.push(t);
            }
            else {
                result.push(this.ticketsCache[t]);
            }
        });

        if (toFetch.length > 0) {
            const jql = `key in ('${toFetch.join("', '")}')`;
            try {
                const list = await this.$jira.searchTickets(jql, fields, undefined, opts);
                result.addRange(list);
            } catch (err) {
                console.error(err);
                /*
                const { warningMessages, errorMessages = warningMessages } = err.error || {};
                let messages = ['Unknown error occured. Check the console for more details'];
                if (errorMessages?.length) {
                    messages = errorMessages;
                } else if (warningMessages?.length) {
                    messages = warningMessages;
                }
                messages = messages.join('\r\n');
                this.$message.error(messages, 'Query Error');*/
            }
        }

        return result;
    }

    //#region New Import functions

    async pullProjectMetadata(projectListToPull) {
        const metadata = await this.$jira.getProjectImportMetadata(projectListToPull);
        if (this.projectImportMetadata) {
            this.projectImportMetadata = { ...this.projectImportMetadata, ...metadata };
        }
        else {
            this.projectImportMetadata = metadata;
        }
        return !!Object.keys(metadata).length;
    }

    async validateIssuesForImport({ columns, importData: issues, addedFields }, settings) {
        await this.pullProjectMetadata(issues.distinct(i => i.project?.value, true));

        const importData = await issues.mapAsync(issue => this.validateIssueForImport(issue, columns, addedFields, true, settings));
        await this.fillIssueDetails(importData, columns);
        await importData.mapAsync(async issue => {
            const { issuekey, importStatus } = issue;
            const isInsert = !issuekey.value;
            const metadata = isInsert ? importStatus.createMetadata : importStatus.updateMetadata;
            if (metadata) {
                importStatus.hasError = !(await this.validateFieldsUsingMetadata(issue, columns, metadata.fields, addedFields, isInsert)) || importStatus.hasError;
            }
            issue.disabled = importStatus.hasError;
            if (issue.disabled) {
                issue.selected = false;
            }
        });
        return { columns, importData, addedFields };
    }

    async fillIssueDetails(issues, columns) {
        const issueKeys = issues.distinct(i => i.issuekey?.value, true);
        const filteredCols = columns.filter(c => !c.hasError && ignoredFields.indexOf(c.field) === -1);
        const colNames = filteredCols.map(c => c.field);

        const jiraIssues = await this.getTicketDetails(issueKeys, false, colNames, { ignoreErrors: true, ignoreWarnings: true });
        issues.forEach(issue => {
            const key = issue.issuekey.value;
            if (!key || issue.issuekey.error) {
                return;
            }

            const jiraIssue = jiraIssues[key];
            if (!jiraIssue) {
                issue.issuekey.error = msgValueInvalid;
                issue.importStatus.hasError = true;
                return;
            }

            const fields = jiraIssue.fields;
            filteredCols.forEach(col => {
                const { field } = col;
                const curValue = fields[field];
                if (!issue[field]) { issue[field] = {}; }
                this.setJiraValue(issue, col, curValue);
            });
        });
    }

    setJiraValue(issue, col, jiraValue) {
        const { field, fieldType } = col;
        if (field === 'issuekey') { return; }
        const { [field]: valueObj } = issue;
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
        }
        else if (fieldType === 'user') {
            this.setUserValueObj(valueObj.jiraValue, jiraValue);
            this.clearUserIfUnChanged(valueObj, jiraValue);
        }
        else if (Array.isArray(jiraValue)) {
            const val = [];
            valueObj.jiraValue.value = val;
            jiraValue.forEach(jv => {
                if (typeof jv === 'object') {
                    const item = {};
                    val.push(item);
                    this.setKnownValueObj(item, jv);
                } else {
                    val.push({ value: jv });
                }
            });
        }
        else if (typeof (jiraValue) === 'object') {
            this.setKnownValueObj(valueObj.jiraValue, jiraValue);
            this.clearValueIfUnChanged(valueObj, jiraValue);
        }
        else {
            valueObj.jiraValue = { value: jiraValue };
            if (valueObj.value === jiraValue) {
                delete valueObj.value;
                delete valueObj.displayText;
                delete valueObj.avatarUrl;
            }
        }
    }

    clearValueIfUnChanged(valueObj, jiraValue) {
        const { value } = valueObj;
        if (!value) { return; }
        if (!Array.isArray(value)) {
            const toCompare = prepareForCompare(value);
            if (toCompare === jiraValue.id
                || toCompare === prepareForCompare(jiraValue.key)
                || toCompare === prepareForCompare(jiraValue.name)) {
                delete valueObj.value;
                delete valueObj.displayText;
                delete valueObj.avatarUrl;
            }
        }
    }

    clearUserIfUnChanged(valueObj, jiraValue) {
        const { value } = valueObj;
        if (!value) { return; }
        const toCompare = prepareForCompare(value);
        if (toCompare === jiraValue.id
            || toCompare === prepareForCompare(jiraValue.key)
            || toCompare === prepareForCompare(jiraValue.name)
            || toCompare === prepareForCompare(jiraValue.emailAddress)
            || toCompare === prepareForCompare(jiraValue.accountId)
            || toCompare === prepareForCompare(jiraValue.displayName)
        ) {
            delete valueObj.value;
            delete valueObj.displayText;
            delete valueObj.avatarUrl;
        }
    }

    async validateIssueForImport(issue, columns, addedFields, isBulk, settings) {
        issue = { ...issue };

        const actions = {};

        const importStatus = {
            hasError: false,
            actions
        };
        issue.importStatus = importStatus;

        if (issue.issuekey.value) {
            if (issue.delete) {
                actions.delete = true;
                return issue;
            }
            else if (issue.clone) {
                actions.clone = true;
            }

            await this.validateIssueForUpdate(issue, columns, addedFields, isBulk, settings);
        } else {
            actions.create = true;
            await this.validateIssueForCreate(issue, columns, addedFields, isBulk, settings);
        }

        return issue;
    }

    async validateIssueForUpdate(issue, columns, addedFields, isBulk, settings) {
        const { issuekey, importStatus } = issue;
        let issueMetadata = issue.updateMetadata;

        if (!issueMetadata) {
            try {
                issueMetadata = await this.$jira.getIssueMetadata(issuekey.value);
            }
            catch {
                issuekey.error = msgValueInvalid;
                importStatus.hasError = true;
                return;
            }
        }

        const { fields } = issueMetadata;
        let { fieldsArr } = issueMetadata;
        if (!fieldsArr) {
            fieldsArr = Object.keys(fields).map(f => fields[f]);
            issueMetadata.fieldsArr = fieldsArr;
        }
        this.addMissingColumns(columns, addedFields, fieldsArr, settings);
        importStatus.updateMetadata = issueMetadata;
    }

    async validateIssueForCreate(issue, columns, addedFields, isBulk, settings) {
        const { importStatus } = issue;

        const { project, parent, issuetype } = issue;

        delete project.error;
        delete project.warning;
        if (!project.value) {
            project.error = msgValueRequired;
        }
        else if (!this.projectImportMetadata[project.value]) {
            if (isBulk || !await this.projectListToPull([project.value])) {
                project.error = msgValueInvalid;
            }
        }

        delete issuetype.error;
        delete issuetype.warning;
        if (!issuetype.value) {
            issuetype.error = msgValueRequired;
        }
        else if (!project.error) {
            const projectMetadata = this.projectImportMetadata[project.value];
            const typeObj = projectMetadata.issuetypesObj[issuetype.value.toLowerCase().replace(/ /g, '-')];
            if (typeObj) {
                issue.issuetype.value = typeObj.name;
                issue.issuetype.displayText = typeObj.name;
                issue.issuetype.avatarUrl = typeObj.iconUrl;

                if (parent.value && !typeObj.subtask) {
                    issuetype.error = "Must be a subtask";
                } else if (!parent.value && typeObj.subtask) {
                    issuetype.error = "Must not be a subtask";
                }

                //importStatus.fieldInfo = typeObj.fields;
                if (!typeObj.fieldsArr) {
                    typeObj.fieldsArr = Object.keys(typeObj.fields).map(f => typeObj.fields[f]);
                }
                this.addMissingColumns(columns, addedFields, typeObj.fieldsArr, settings);
                importStatus.createMetadata = typeObj;
            }
            else {
                issuetype.error = msgValueInvalid;
            }
        }

        importStatus.hasError = importStatus.hasError || !!project.error || !!parent.error || !!issuetype.error;

        return issue;
    }

    addMissingColumns(columns, addedFields, fields, settings) {
        fields.forEach(col => {
            if (col.required && !addedFields[col.key]) {
                addedFields[col.key] = true;
                columns.push({
                    field: col.key, displayText: col.name,
                    fieldType: this.getFieldType(col),
                    custom: !!col.schema?.customId,
                    headerEditable: false,
                    ...settings
                });
            }
        });
    }

    getFieldType(col) {
        const { schema: { type, system } = {} } = col;
        return type === 'array' ? system : type;
    }

    async validateFieldsUsingMetadata(issue, columns, fields, addedFields, insert) {
        let isValid = true;
        const hasIssueKey = !!issue.issuekey.value;
        await columns.mapAsync(async col => {
            if (~ignoredFields.indexOf(col.field)) { return; }

            const field = fields[col.field];
            const valueObj = issue[col.field] || {};
            if (!field) {
                if (valueObj.value) {
                    if (insert) {
                        valueObj.warning = msgInvalidForCreation;
                    }
                    else {
                        valueObj.error = 'Field not allowed for update';
                    }

                    issue[col.field] = valueObj;
                    isValid = isValid && !valueObj.error;
                }
                return;
            }
            const { key, required, autoCompleteUrl, allowedValues, schema } = field; // ToDo: 

            if (key === 'issuetype') { return; } // Issue type is already validated and hence no need of additional validation

            const value = valueObj.value;

            delete valueObj.error;
            //delete valueObj.warning;

            if (required && !value && (!hasIssueKey || valueObj.delete)) {
                issue[key] = valueObj;
                valueObj.error = msgValueRequired;
            }

            if (addedFields[key]) {
                if (allowedValues) {
                    valueObj.allowedValues = allowedValues;
                }
                else if (autoCompleteUrl) {
                    valueObj.autoCompleteUrl = autoCompleteUrl;
                    issue[key] = valueObj;
                }

                if (schema.type === 'array') {
                    issue[key] = valueObj;
                    valueObj.isArray = true;

                    if (value && !Array.isArray(value)) {
                        valueObj.value = value.split(/[;,]/g).distinct().map(v => ({ value: v.trim() }));
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

    verifyAllowedValues(allowedValues, valueObj) {
        delete valueObj.error;
        if (allowedValues && valueObj) {
            valueObj.allowedValues = allowedValues;
            const { value } = valueObj;
            if (Array.isArray(value)) {
                let isValid = true;
                value.forEach(val => {
                    if (!this.verifyAllowedValues(allowedValues, val)) {
                        valueObj.error = 'One or more item is invalid';
                        isValid = false;
                    }
                });
                return isValid;
            }
            else {
                const valueItem = this.getField(value, allowedValues);
                if (valueItem) {
                    this.setKnownValueObj(valueObj, valueItem);
                    return true;
                }
                else {
                    valueObj.error = msgValueInvalid;
                    return false;
                }
            }
        }

        return !valueObj.error;
    }

    async validateFieldType(schema, valueObj) {
        if (!valueObj?.value) { return; }

        const value = valueObj.value;

        const { type } = schema || {};
        let isValid;
        switch (type) {
            case "string":
                isValid = typeof value === type;
                break;
            case "date":
            case "datetime":
                isValid = this.validateFieldType_Date(valueObj, value, type);
                break;
            case "array":
                isValid = true;
                // isValid = Array.isArray(value); // ToDo: need to check how to validate array
                break;
            case "user":
                isValid = await this.validateFieldType_User(valueObj, value);
                break;
            case "issuelink":
                isValid = await this.validateFieldType_IssueLink(valueObj, value);
                break;
            default: isValid = true; break;
        }

        if (!isValid) {
            valueObj.error = msgValueInvalid;
        }
    }

    validateFieldType_Date(valueObj, value, type) {
        const dateObj = this.$utils.convertDate(value);
        if (dateObj) {
            valueObj.value = dateObj;
            const { formatDateTime, formatDate } = this.$userutils;
            valueObj.displayText = type === 'datetime' ? formatDateTime(dateObj) : formatDate(dateObj);
            return true;
        }

        return false;
    }

    async validateFieldType_User(valueObj, value) {
        if (!value) { return true; }
        const user = await this.getUserObject(value);
        if (user) {
            this.setUserValueObj(valueObj, user);
            return true;
        }
    }

    setUserValueObj(valueObj, user) {
        valueObj.value = user.emailAddress || user.name || user.accountId || valueObj.value;
        valueObj.displayText = user.displayName;
        const { avatarUrls } = user;
        const avt = avatarUrls && (avatarUrls['24x24'] || avatarUrls['32x32'] || avatarUrls['48x48'] || avatarUrls['16x16']);
        if (avt) {
            valueObj.avatarUrl = avt;
        }
    }

    setKnownValueObj(valueObj, valueItem) {
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

    async validateFieldType_IssueLink(valueObj, value) {
        const issueLink = await this.searchIssueForPicker(value);
        if (issueLink) {
            valueObj.value = issueLink.key;
            valueObj.displayText = `${issueLink.key}: ${issueLink.summary}`;
            return true;
        }
    }

    getField(value, allowedValues) {
        const strForCompare = prepareForCompare(value);
        const valueItem = allowedValues.filter(v => v.id === value || prepareForCompare(v.key) === strForCompare || prepareForCompare(v.name) === strForCompare || prepareForCompare(v.value) === strForCompare)[0];
        return valueItem;
    }

    async getUserObject(value) {
        const users = await this.$jira.searchUsers(value);
        if (users.length > 1) {
            const filteredUsers = users.filter(u => compareIgnoreCase(u.accountId, value)
                || compareIgnoreCase(u.emailAddress, value)
                || compareIgnoreCase(u.displayName, value)
                || compareIgnoreCase(u.name, value)
            );

            if (filteredUsers.length) {
                return filteredUsers[0];
            }
        }

        return users[0];
    }

    async searchIssueForPicker(query) {
        let issues = await this.$jira.searchIssueForPicker(query, { currentJQL: '' });
        if (issues.length > 1) {
            const key = prepareForCompare(query);
            issues = issues.filter(issue => prepareForCompare(issue.key) === key);
        }

        return issues[0];
    }

    async importIssue(issue, columns, addedFields) {
        const { issuekey, clone, delete: deleteIssue, importStatus } = issue;
        if (deleteIssue) {
            try {
                await this.$jira.deleteIssue(issuekey.value);
                importStatus.imported = true;
                issue.disabled = true;
                delete issue.selected;
            } catch (err) {
                importStatus.hasError = true;
                const msg = err.response || 'Check console for error details';
                importStatus.error = `Error: ${err.status}, ${msg.length < 50 ? msg : 'Check console for error details'}`;
                console.error("Delete Error: Key:-", issuekey.value, " Error Details:-", err);
            }
            return;
        }
        else if (clone) {
            try {
                const summary = issue.summary.value || issue.summary.jiraValue;
                const response = await this.$jira.cloneIssue(issuekey.value, summary);
                issue.summary.jiraValue = summary;
                importStatus.imported = true;
                issue.disabled = true;
                delete issue.selected;
                delete issue.clone;
                delete issue.summary.value;
                if (response.key) {
                    issuekey.value = response.key;
                } else {
                    console.log(issuekey.value, ' cloning is Queued. Task Details:-', response);
                    importStatus.hasWarning = true;
                    importStatus.warning = 'Cloning is queued in Jira. Check Jira Issue for status.';
                    return;
                }
            } catch (err) {
                importStatus.hasError = true;
                const msg = err.response || 'Check console for error details';
                importStatus.error = `Error: ${err.status}, ${msg.length < 50 ? msg : 'Check console for error details'}`;
                console.error("Clone Error: Key:-", issuekey.value, " Error Details:-", err);
            }
        }

        let hasFieldsForUpdate = !!issuekey.value;

        if (!issuekey.value) { // create issue
            const { fields, pending } = this.getFieldsForImport(issue, columns, importStatus.createMetadata.fields);

            try {
                const response = await this.$jira.createIssue(fields);
                const { key } = response;
                if (key) {
                    issuekey.value = key;
                    hasFieldsForUpdate = !!pending.length;
                    importStatus.imported = true;
                    issue.disabled = true;
                    delete issue.selected;
                    delete importStatus.hasWarning;
                    delete importStatus.warning;
                }
                console.log("Issue created", response);

                // Clear the fields which are already imported
                Object.keys(fields).forEach(f => {
                    const { displayText, value, avatarUrl } = issue[f];
                    issue[f].jiraValue = { displayText, value, avatarUrl };
                    delete issue[f].value;
                    delete issue[f].displayText;
                    delete issue[f].avatarUrl;
                });

                if (hasFieldsForUpdate) {
                    try {
                        const metadata = await this.$jira.getIssueMetadata(issuekey.value);
                        importStatus.updateMetadata = metadata;
                        const isValidForUpdate = await this.validateFieldsUsingMetadata(issue, columns, metadata.fields, addedFields, false);
                        if (!isValidForUpdate) {
                            importStatus.hasError = true;
                            hasFieldsForUpdate = false;
                        }
                    } catch (err) {
                        importStatus.hasError = true;
                        importStatus.error = `Update Error: ${err.status}, ${err.response?.length < 50 ? err.response : 'Check console for error details'}`;
                        console.error("Error pulling update metadata: Fields:-", fields, " Error Details:-", err);
                    }
                }
            } catch (err) {
                importStatus.hasError = true;
                importStatus.error = `Error: ${err.status}, ${err.response?.length < 50 ? err.response : 'Check console for error details'}`;
                console.error("Import Error: Key:-", issuekey.value, " Error Details:-", err);
            }
        }

        if (issuekey.value && hasFieldsForUpdate && importStatus.updateMetadata) {
            const { fields, pending } = this.getFieldsForImport(issue, columns, importStatus.updateMetadata.fields);

            try {
                if (Object.keys(fields).length) {
                    const response = await this.$jira.updateIssue(fields);
                    console.log("Issue updated", response);

                    importStatus.imported = true;
                    issue.disabled = true;
                    delete issue.selected;
                    delete importStatus.hasWarning;
                    delete importStatus.warning;

                    // Clear the fields which are already imported
                    Object.keys(fields).forEach(f => {
                        const { displayText, value, avatarUrl } = issue[f];
                        issue[f].jiraValue = { displayText, value, avatarUrl };
                        delete issue[f].value;
                        delete issue[f].displayText;
                        delete issue[f].avatarUrl;
                    });
                }

                if (pending.length) {
                    importStatus.hasWarning = true;
                    importStatus.warning = `Following fields not imported: ${pending.join()}`;
                }
            } catch (err) {
                importStatus.hasError = true;
                importStatus.error = `Error: ${err.status}, ${err.response?.length < 50 ? err.response : 'Check console for error details'}`;
                console.error("Update Error: Key:-", issuekey.value, "Fields:-", fields, " Error Details:-", err);
            }
        }

        return issue;
    }

    getFieldsForImport(issue, columns, fields) {
        const result = {};
        const pending = [];
        columns.forEach((col) => {
            const { field } = col;
            const valueObj = issue[field];

            if (!valueObj?.value) {
                return;
            }

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

    getFieldValueForImport = (value, field) => {
        const { schema: { type, items }, allowedValues } = field;
        let returnValue = null;

        switch (type) {
            case "user": returnValue = { name: value }; break;
            case "date": returnValue = this.$utils.formatDateTimeForJira(value); break; // Must be in "2019-04-16T00:00:00.000Z" format
            case "array":
                returnValue = value.map(v => {
                    v = v.value;
                    const val = {};

                    if (items === "string") { return v; }
                    else {
                        let fieldName = null;

                        if (allowedValues) {
                            const cVal = prepareForCompare(v);
                            for (let i = 0; i < allowedValues.length; i++) {
                                const { id, key, name } = allowedValues[i];

                                if (key && cVal === prepareForCompare(key)) { fieldName = "key"; v = key; }
                                else if (name && cVal === prepareForCompare(name)) { fieldName = "name"; v = name; }
                                else if (v === id) { fieldName = "id"; v = id; }
                                else { continue; }

                                break;
                            }
                        }
                        else {
                            if (isNaN(v)) { fieldName = "key"; } // ToDo: need to verfy with value
                            else { fieldName = "id"; }
                        }
                        val[fieldName] = v;
                    }

                    return val;
                });
                break;
            case "string": returnValue = value; break;
            case "timetracking": returnValue = value; break; // ToDo: need to check with 15, 15h, etc
            // ToDo: need to verify for project
            default:
                const val = {};

                let fieldName = null;

                if (isNaN(value)) { fieldName = "key"; } // ToDo: need to verfy with value
                else { fieldName = "id"; }

                if (allowedValues) {
                    for (let i = 0; i < allowedValues.length; i++) {
                        const { id, key, name } = allowedValues[i];

                        if (value === key) { fieldName = "key"; }
                        else if (value === name) { fieldName = "name"; }
                        else if (value === id) { fieldName = "id"; }
                        else { continue; }

                        break;
                    }
                }

                val[fieldName] = value;

                returnValue = val;
                break;
        }

        return returnValue;
    };

    /*
    verifyAllowedAutocompleteValues(autoCompleteUrl, valueObj) {
        if (autoCompleteUrl && valueObj) {
            const { value } = valueObj;
            if (Array.isArray(value)) {
                value.forEach(val => {
                    if (this.verifyAllowedValues(autoCompleteUrl, val)) {
                        valueObj.error = msgValueInvalid;
                    }
                });
            }
            else {
                delete valueObj.error;

                const valueItem = this.getItemFromUrl(autoCompleteUrl, valueObj?.value);
                if (valueItem) {
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
                else {
                    valueObj.error = msgValueInvalid;
                }

                return !!valueItem;
            }
        }
    }

    async getItemFromUrl(url, value) {
        const items = await this.$jira.searchUsers(value);
        if (items.length > 1) {
            const filteredUsers = items.filter(u => compareIgnoreCase(u.accountId, value)
                || compareIgnoreCase(u.emailAddress, value)
                || compareIgnoreCase(u.displayName, value)
                || compareIgnoreCase(u.name, value)
            );

            if (filteredUsers.length) {
                return filteredUsers[0];
            }
        }

        return items[0];
    }*/
    //#endregion

    //#region Old Import functions
    async processIssuesForImport(issues) {
        issues = repeatIssuesWithMultiValues(issues);

        const importData = issues.map(prepareParentAndProjectFields);
        const projectListToPull = importData.distinct(i => i.project, true);

        const metadata = await this.$jira.getProjectImportMetadata(projectListToPull);

        const issueKeys = importData.distinct(i => i.issuekey || null, true);
        const ticketDetails = await this.getTicketDetails(issueKeys, false);

        const importFields = await this.getFieldsToImport(metadata, issues);

        const processedIssues = await importData.mapAsync(async issue => {
            const ticketFields = issue.issuekey && ticketDetails && (ticketDetails[issue.issuekey] || {}).fields;
            return await this.prepareIssue(issue, metadata, importFields, ticketFields);
        });

        return { importFields, metadata, importData: processedIssues, ticketDetails };
    }

    async prepareIssue(issue, metadata, importFields, ticketFields) {
        const result = await this.validateBasicFields(issue, metadata, ticketFields);

        const { raw, options, fields, issuetype } = result;

        let hasError = this.validateCrossFields(raw, options, issuetype) || result.hasError;

        const importFieldKeys = Object.keys(fields);
        await importFieldKeys.mapAsync(async f => {
            const fieldMetadata = fields[f];

            const fieldOption = this.getOptionField(options, f);

            await this.prepareField(f, fieldMetadata, raw, fieldOption, issuetype, ticketFields);

            if (!hasError) {
                hasError = fieldOption.errors.length > 0;
            }
        });

        if (importFieldKeys.length > 0) {
            Object.keys(raw).forEach((f) => {
                const fieldOption = this.getOptionField(options, f, true);
                const importValue = this.assignExistingValuesWhenEmpty(f, raw, fieldOption, ticketFields);

                if ((fields[f] || f === "issuekey") && importValue) { return; }

                const fieldMetadata = importFields.first(cf => cf.key === f);

                fieldOption.displayValue = importValue;

                if (fieldMetadata) {
                    if (raw.issuekey) {
                        if (this.isValueChanged(f, raw, ticketFields)) {
                            fieldOption.errors.push("This field is not editable");
                            hasError = true;
                        }
                    }
                    else {
                        fieldOption.warnings.push(msgInvalidForCreation);
                    }
                }
                else {
                    fieldOption.errors.push("This is not a known field");
                    hasError = true;
                }
            });
        }

        if (hasError) {
            result.hasError = hasError;
            result.status = "Error";
        } else {
            result.status = `Will Import (${raw.issuekey ? "update" : "new"})`;
        }

        return result;
    }

    assignExistingValuesWhenEmpty(field, issue, option, ticketFields) {
        let value = (issue[field] || "").trim();

        // If the value given is null then remove the value while updating
        const setValueToNull = value.toLowerCase() === "null";
        if (setValueToNull) {
            value = "";
            issue[field] = "";
        }

        const existingValue = ticketFields && ticketFields[field];

        if (existingValue && !value && !setValueToNull) {
            if (typeof existingValue === "object") {
                value = existingValue.name || existingValue.id;
            }
            else {
                value = existingValue;
            }

            issue[field] = value;
            option.displayValue = value;
        }

        return value;
    }

    isValueChanged(field, issue, ticketFields) {
        const value = (issue[field] || "").trim().toLowerCase();

        const existingValue = ticketFields && ticketFields[field];

        if (existingValue) {
            if (typeof existingValue === "object") {
                // eslint-disable-next-line eqeqeq
                return existingValue.id != value && (existingValue.name || "").toLowerCase() !== value;
            } else {
                return (`${existingValue}`).toLowerCase() !== value;
            }
        }

        return false;
    }

    getOptionField(options, field, includeWarning) {
        const fieldOption = options[field] || { errors: [] };
        options[field] = fieldOption;
        if (includeWarning) {
            fieldOption.warnings = [];
        }
        return fieldOption;
    }

    async validateBasicFields(raw, metadata, ticketFields) {
        const options = { project: { errors: [] }, issuetype: { errors: [] } };

        const project = this.assignExistingValuesWhenEmpty("project", raw, options.project, ticketFields);
        const issuetype = this.assignExistingValuesWhenEmpty("issuetype", raw, options.issuetype, ticketFields);

        let hasError = false;

        if (!project) {
            options.project.errors.push("Value is required");
            hasError = true;
        }
        else {
            options.project.displayValue = project;
        }

        if (!issuetype) {
            options.issuetype.errors.push("Value is required");
            hasError = true;
        }
        else {
            options.issuetype.displayValue = issuetype;
        }

        let fields = {};

        try {
            if (raw.issuekey) {
                fields = await this.$jira.getIssueMetadata(raw.issuekey);
            }
        } catch (err) {
            const { error: { errorMessages = [] } = {} } = err;

            const issuekeyOption = this.getOptionField(options, "issuekey");
            issuekeyOption.errors = errorMessages;

            hasError = true;
        }

        let projectMetadata = project && metadata[project]; // Take project specific metadata

        if (projectMetadata) {
            raw.project = projectMetadata.key;
            options.project.displayValue = projectMetadata.name;
        }
        else if (project) {
            options.project.errors.push("Value is invalid");
            hasError = true;
        }

        let currentIssueType;

        if (raw.issuekey) {
            if (projectMetadata) {
                projectMetadata = { ...projectMetadata, fields };
            }
        }
        else {
            const { issuetypes } = projectMetadata || { issuetypes: [] };

            const issuetypeForSearch = prepareForCompare(issuetype);

            currentIssueType = issuetypeForSearch && issuetypes.filter(it => prepareForCompare(it.name) === issuetypeForSearch)[0];

            if (currentIssueType) {
                raw.issuetype = currentIssueType.name;
                options.issuetype.displayValue = currentIssueType.name;
                fields = currentIssueType.fields;
            }
            else if (issuetype) {
                options.issuetype.errors.push("Value is invalid");
                hasError = true;
            }
        }

        return { raw, options, fields, issuetype: currentIssueType, project: projectMetadata, hasError };
    }

    validateCrossFields(raw, options, issuetype) {
        if (!issuetype) { return true; }

        const { subtask } = issuetype;

        const parentOption = this.getOptionField(options, "parent");
        const issuetypeOption = this.getOptionField(options, "issuetype");

        let hasError = false;

        if (raw.parent && !subtask) {
            parentOption.errors.push("Value is invalid for this issue type");
            issuetypeOption.errors.push("This is not a valid sub task type");
            hasError = true;
        }

        if (subtask && !raw.parent) {
            issuetypeOption.errors.push("Subtask is not valid without parent");
            hasError = true;
        }

        return hasError;
    }

    async prepareField(field, metadata, issue, option, issuetype, ticketFields) {
        const { required, schema, allowedValues } = metadata;
        const value = this.assignExistingValuesWhenEmpty(field, issue, option, ticketFields);

        if (required && !value) {
            option.errors.push("Value is required");
        }

        if (!option.displayValue && value) {
            option.displayValue = value;
        }

        await this.validateType(schema, value, option);

        this.validateAllowedValues(issue, field, allowedValues, value, option);
    }

    validateAllowedValues(issue, field, allowedValues, value, option) {
        if (allowedValues && value) {
            const valueItem = this.getField(value, allowedValues);
            if (valueItem) {
                option.displayValue = valueItem.name || valueItem.value;
                issue[field] = valueItem.id || valueItem.key || valueItem.name || valueItem.value;
            }
            else {
                option.errors.push("Invalid value for this field");
            }
        }
    }

    async validateType(schema, value, option) {
        if (!value) { return; }

        const { type } = schema || {};
        let isValid;
        switch (type) {
            case "string":
                isValid = typeof value === type;
                break;
            case "array":
                isValid = true;
                // isValid = Array.isArray(value); // ToDo: need to check how to validate array
                break;
            case "user":
                isValid = true;
                await this.validateIfValidUser(value, option);
                break;
            default: isValid = true; break;
        }

        if (!isValid) {
            option.errors.push("Invalid value for this field");
        }
    }

    validateIfValidUser(value, option) {
        return this.getUserObject(value).then((u) => {
            option.displayValue = u.displayName;
        }, (e) => {
            option.errors.push("Not a valid jira user name");
        });
    }

    async getFieldsToImport(metadata, rawissues) {
        const refFields = {};
        const importFields = [];

        const allProjects = Object.keys(metadata);

        allProjects.forEach(pKey => {
            const project = metadata[pKey];
            const { issuetypes } = project;

            issuetypes.forEach(iType => {
                const { fields } = iType;

                const fieldList = Object.keys(fields);

                fieldList.filter(f => !refFields[f]).forEach(key => {
                    refFields[key] = true;
                    const { required, name } = fields[key];
                    importFields.push({ key, required, name });
                });
            });
        });

        refFields.issuekey = true; // Issue key will not be part of this list. So always ignore it

        // Check if their are any fields not part of metadata and create it.
        const remainingFields = Object.keys(rawissues[0] || {}).filter(f => !refFields[f]);
        if (remainingFields && remainingFields.length > 0) {
            const jiraFieldList = await this.$jira.getCustomFields();

            remainingFields.forEach(key => {
                const field = jiraFieldList.first(jf => jf.id === key);
                if (field) {
                    importFields.push({ key, name: field.name, jiraField: field });
                }
                else {
                    importFields.push({ key, name: key, unknown: true });
                }
            });
        }

        return importFields;
    }

    async importIssues(importData) {
        importData = [...importData];

        const importableData = await this.prepareIssuesForImport(importData);
        const issuesToImport = importableData.map(i => ({ fields: i.fields }));

        const result = await this.$jira.bulkImportIssues(issuesToImport)
            .then(null, (err) => err.error)
            .then(result => {
                const { errors, issues, errorMessages } = result;

                let hasIndividualStatus = false;
                const itemsWithErrors = [];

                if (errors && errors.length > 0) {
                    errors.forEach(e => {
                        const { failedElementNumber, elementErrors: { errors: itemErrors, errorMessages } } = e;

                        itemsWithErrors.push(failedElementNumber);

                        const importItem = { ...importData[failedElementNumber] };
                        importData[failedElementNumber] = importItem;

                        const { options } = importItem;

                        Object.keys(itemErrors).forEach(field => {
                            const option = this.getOptionField(options, field);
                            option.errors.push(itemErrors[field]);
                        });

                        if (errorMessages && errorMessages.length) {
                            if (!importItem.statusErrors) {
                                importItem.statusErrors = [];
                            }

                            importItem.statusErrors.addRange(errorMessages);
                        }

                        importItem.hasError = true;
                        importItem.status = "Import Error";
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
                            issue.status = "Imported";
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

    async prepareIssuesForImport(importData) {
        let fieldsFromJira = await this.$jira.getCustomFields();

        fieldsFromJira = fieldsFromJira.reduce((obj, f) => {
            obj[f.id] = f;

            return obj;
        }, {});

        return importData.map(issue => {
            const { fields: metadata, raw } = issue;

            const fieldsWithValue = Object.keys(raw).filter(k => !!raw[k]);

            const update = {};
            let needsUpdate = false;

            const fields = fieldsWithValue.reduce((obj, f) => {
                if (f.indexOf(".") >= 0) {
                    const split = f.split(".");

                    const value = this.getValueForImport(raw[f], metadata[split[0]] || fieldsFromJira[split[0]]);

                    if (metadata[split[0]]) {
                        obj[split[0]] = obj[split[0]] || {};
                        obj[split[0]][split[1]] = value;
                    } else {
                        update[split[0]] = update[split[0]] || {};
                        update[split[0]][split[1]] = value;
                        needsUpdate = true;
                    }
                }
                else {
                    const value = this.getValueForImport(raw[f], metadata[f] || fieldsFromJira[f]);

                    if (metadata[f]) {
                        obj[f] = value;
                    }
                    else {
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

    getValueForImport = (value, field) => {
        const { schema: { type, items }, allowedValues } = field;
        let returnValue = null;

        switch (type) {
            case "user": returnValue = { name: value }; break;
            case "date": returnValue = this.$utils.formatDateTimeForJira(value); break; // Must be in "2019-04-16T00:00:00.000Z" format
            case "array":
                returnValue = value.split(",").map(v => { // ToDo: additional check needed based on allowedValues
                    const val = {};

                    if (items === "string") { return v; }
                    else {
                        let fieldName = null;

                        if (allowedValues) {
                            for (let i = 0; i < allowedValues.length; i++) {
                                const { id, key, name } = allowedValues[i];

                                if (key && value === key) { fieldName = "key"; }
                                else if (value === name) { fieldName = "name"; }
                                else if (value === id) { fieldName = "id"; }
                                else { continue; }

                                break;
                            }
                        }
                        else {
                            if (isNaN(v)) { fieldName = "key"; } // ToDo: need to verfy with value
                            else { fieldName = "id"; }
                        }
                        val[fieldName] = v;
                    }

                    return val;
                });
                break;
            case "string": returnValue = value; break;
            case "timetracking": returnValue = value; break; // ToDo: need to check with 15, 15h, etc
            // ToDo: need to verify for project
            default:
                const val = {};

                let fieldName = null;

                if (isNaN(value)) { fieldName = "key"; } // ToDo: need to verfy with value
                else { fieldName = "id"; }

                if (allowedValues) {
                    for (let i = 0; i < allowedValues.length; i++) {
                        const { id, key, name } = allowedValues[i];

                        if (value === key) { fieldName = "key"; }
                        else if (value === name) { fieldName = "name"; }
                        else if (value === id) { fieldName = "id"; }
                        else { continue; }

                        break;
                    }
                }

                val[fieldName] = value;


                returnValue = val;
                break;
        }

        return returnValue;
    };

    //#endregion
}

function compareIgnoreCase(str1, str2) {
    str1 = (str1 || "").toLowerCase();
    str2 = (str1 || "").toLowerCase();

    return str1 === str2;
}

const comparisonCharsRegex = / -_/g;
function prepareForCompare(value) {
    if (!value) { return value; }

    if (typeof value === "string") {
        return value.replace(comparisonCharsRegex, "").toLowerCase();
    }
    else {
        return value.toString().toLowerCase();
    }
}