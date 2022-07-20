import { colSpecialProps } from "./helpers";

const unsupportedFields = ['watches', 'thumbnail', 'issuelinks', 'attachment', 'subtasks', 'votes', 'worklog'];

export function processData(data, colMapping, defaultColumns, invalidHeaderTemplate, unsupportedFieldTemplate, settings) {
    const columns = defaultColumns.filter(c => c.field !== 'status' && c.field !== 'importStatus');
    const addedFields = columns.reduce((obj, col) => {
        obj[col.field] = true;
        return obj;
    }, { importStatus: true });

    Object.keys(data[0]).forEach(f => {
        if (addedFields[f]) { return null; }

        if (unsupportedFields.indexOf(f) > -1) {
            columns.push({
                field: f,
                cellEditable: false,
                footerEditable: false,
                hasError: true,
                headerTemplate: unsupportedFieldTemplate
            });
            return;
        }

        const col = colMapping[f];

        if (col) {
            const { schema: { type, system } = {} } = col;
            const fieldType = type === 'array' ? system : type;

            addedFields[f] = true;
            columns.push({
                field: col.key, displayText: col.name, fieldType,
                custom: col.custom,
                headerEditable: false,
                ...settings,
                ...colSpecialProps[col.key]
            });
        }
        else {
            columns.push({
                field: f,
                cellEditable: false,
                footerEditable: false,
                hasError: true,
                headerTemplate: invalidHeaderTemplate
            });
        }
    });

    columns.push(defaultColumns[defaultColumns.length - 1]);

    const importData = repeatIssuesWithMultiValues(data).map(convertDataForDisplay.bind(addedFields));

    return { columns, importData, addedFields };
}

export function repeatIssuesWithMultiValues(issues) {
    const result = [];
    issues.forEach(issue => {
        if (!issue.issuekey && (issue.parent || issue.project)) {
            const parents = (issue.parent || "").trim().toUpperCase().split(/[ ;,]/gi).filter(p => !!p).distinct();
            const projects = (issue.project || "").trim().toUpperCase().split(/[ ;,]/gi).filter(p => !!p)
                .distinct().filter(p => parents.find(i => !i.toUpperCase().startsWith(`${p.toUpperCase()}-`)));
            let added = false;

            if (parents.length > 1 || (parents.length && projects.length)) {
                if (parents.length) {
                    parents.forEach(parent => result.push({ ...issue, parent, project: parent.split('-')[0] }));
                    delete issue.parent;
                    added = true;
                }

                if (projects.length) {
                    projects.forEach(project => result.push({ ...issue, project }));
                    added = true;
                }

                if (added) { return; }
            }
        }

        result.push(prepareParentAndProjectFields(issue));
    });

    return result;
}

export function prepareParentAndProjectFields(issue) {
    const ticket = { ...issue };

    Object.keys(ticket).forEach(f => {
        if (!ticket[f]) {
            delete ticket[f];
        }
    });

    let { issuekey, project } = issue;

    if (issuekey) {
        issuekey = issuekey.trim().toUpperCase();
        ticket.issuekey = issuekey;
    }

    if (project) {
        project = project.trim().toUpperCase();
        ticket.project = project;
    }

    if (!project && issuekey) {
        project = issuekey.split("-")[0].toUpperCase();
        ticket.project = project;
    }

    if (ticket.parent) {
        ticket.parent = ticket.parent.trim().toUpperCase();
        if (!project) {
            project = ticket.parent.split("-")[0].toUpperCase();
            ticket.project = project;
        }
    }

    return ticket;
}

function convertDataForDisplay(issue) {
    const result = Object.keys(issue).reduce((obj, key) => {
        let value = issue[key]?.trim();
        if (value && this[key]) {
            if (key === 'delete' || key === 'clone') {
                obj[key] = value === '1' || value.toLowerCase() === 'yes' || value.toLowerCase() === 'true';
            }
            else {
                if (key === 'issuekey') {
                    value = value.toUpperCase();
                }
                obj[key] = value === 'null' ? { clearValue: true } : { value };
            }
        }

        return obj;
    }, {
        selected: true, disabled: false, raw: issue,
        issuekey: {}, parent: {}, project: {}, issuetype: {}
    });

    // If an issue is marked for both clone and deleting, then only clone operation would be allowed
    if (result.delete && result.clone) {
        delete result.delete;
    }

    return result;
}