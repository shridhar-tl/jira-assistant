export default class TicketService {
    static dependencies = ["JiraService"];

    constructor($jira) {
        this.$jira = $jira;

        this.ticketsCache = {};
    }

    getTicketDetails(tickets, asArr) {
        if (!tickets) {
            return null;
        }
        let onlyOne = false;
        if (typeof tickets === "string") {
            tickets = [tickets];
            onlyOne = true;
        }
        return this.fetchTicketDetails(tickets, ["summary", "assignee", "reporter", "priority", "status", "resolution", "created", "updated", "issuetype", "parent"]).then((arr) => {
            const result = {};
            arr.forEach((t) => {
                this.ticketsCache[t.key.toUpperCase()] = t;
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

    fetchTicketDetails(tickets, fields) {
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
            let jql = `'${toFetch.join("', '")}'`;
            jql = `key in (${jql})`;
            return this.$jira.searchTickets(jql, fields).then((list) => {
                result.addRange(list);
                return result;
            });
        }
        else {
            return Promise.resolve(result);
        }
    }

    async processIssuesForImport(issues) {
        const importData = issues.map(this.updateIssueBasicFields);
        const projectListToPull = importData.distinct(i => i.project, true);

        const metadata = await this.$jira.getProjectImportMetadata(projectListToPull);

        const issueKeys = importData.distinct(i => i.issuekey || null, true);
        const ticketDetails = this.getTicketDetails(issueKeys, false);

        const importFields = await this.getFieldsToImport(metadata, issues);

        const processedIssues = await Promise.all(importData.map(async issue => {
            return await this.prepareIssue(issue, metadata, importFields);
        }));

        return { importFields, metadata, importData: processedIssues, ticketDetails };
    }

    async prepareIssue(issue, metadata, importFields) {
        const result = await this.validateBasicFields(issue, metadata);

        const { raw, options, fields, issuetype } = result;

        let hasError = this.validateCrossFields(raw, options, issuetype) || result.hasError;

        const importFieldKeys = Object.keys(fields);
        await importFieldKeys.asyncForEach(async f => {
            const fieldMetadata = fields[f];

            const fieldOption = this.getOptionField(options, f);

            await this.prepareField(f, fieldMetadata, raw, fieldOption, issuetype);

            if (!hasError) {
                hasError = fieldOption.errors.length > 0;
            }
        });

        if (importFieldKeys.length > 0) {
            Object.keys(raw).forEach((f) => {
                if ((fields[f] || f === "issuekey") && raw[f]) { return; }

                const fieldMetadata = importFields.first(cf => cf.key === f);
                const fieldOption = this.getOptionField(options, f, true);

                fieldOption.displayValue = raw[f];

                if (fieldMetadata) {
                    if (raw.issuekey) {
                        fieldOption.errors.push("This field is not editable");
                        hasError = true;
                    }
                    else {
                        fieldOption.warnings.push("Not an allowed field while creation of issue. Will try to update after issue is created.");
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

    getOptionField(options, field, includeWarning) {
        const fieldOption = options[field] || { errors: [] };
        options[field] = fieldOption;
        if (includeWarning) {
            fieldOption.warnings = [];
        }
        return fieldOption;
    }

    async validateBasicFields(raw, metadata) {
        const { project, issuetype } = raw;
        const options = { project: { errors: [] }, issuetype: { errors: [] } };
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

    async prepareField(field, metadata, issue, option, issuetype) {
        const { required, schema, allowedValues } = metadata;
        const value = issue[field];

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
                option.displayValue = valueItem.name;
                issue[field] = valueItem.id || valueItem.key || valueItem.name;
            }
            else {
                option.errors.push("Invalid value for this field");
            }
        }
    }

    getField(value, allowedValues) {
        const strForCompare = prepareForCompare(value);
        const valueItem = allowedValues.filter(v => v.id === value || prepareForCompare(v.key) === strForCompare || prepareForCompare(v.name) === strForCompare)[0];
        return valueItem;
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
                isValid = Array.isArray(value);
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
        return this.$jira.getUserDetails(value).then((u) => {
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

    updateIssueBasicFields = (issue) => {
        const ticket = { ...issue };

        Object.keys(ticket).forEach(f => {
            if (!ticket[f]) {
                delete ticket[f];
            }
        });

        let { issuekey, project } = issue;

        if (issuekey) {
            issuekey = issuekey.toUpperCase();
            ticket.issuekey = issuekey;
        }

        if (project) {
            project = project.toUpperCase();
            ticket.project = project;
        }

        if (!project && issuekey) {
            ticket.project = issuekey.split("-")[0].toUpperCase();
        }

        if (ticket.parent) {
            ticket.parent = ticket.parent.toUpperCase();
        }

        return ticket;
    }

    async importIssues(importData) {
        importData = [...importData];

        const importableData = await this.prepareIssuesForImport(importData);
        const issuesToImport = importableData.map(i => { return { fields: i.fields }; });

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
                        if (!itemsWithErrors.contains(i)) {
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
    }
}

const comparisonCharsRegex = / -_/g;
function prepareForCompare(value) {
    if (!value) { return value; }

    if (typeof value === "string") {
        return value.replace(comparisonCharsRegex, "").toLowerCase();
    }
    else {
        return value.toString();
    }
}