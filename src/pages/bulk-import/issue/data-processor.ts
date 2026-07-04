import { distinct } from '@utils/array-utils';

const unsupportedFields = ['watches', 'thumbnail', 'issuelinks', 'attachment', 'subtasks', 'votes', 'worklog'];

export function processData(
    data: any[],
    colMapping: Record<string, any>,
    defaultColumns: any[],
    invalidHeaderTemplate: any,
    unsupportedFieldTemplate: any,
    settings?: any,
): { columns: any[]; importData: any[]; addedFields: Record<string, boolean> } {
    const columns = defaultColumns.filter((c) => c.field !== 'status' && c.field !== 'importStatus');
    const addedFields: Record<string, boolean> = columns.reduce(
        (obj: Record<string, boolean>, col: any) => {
            obj[col.field] = true;
            return obj;
        },
        { importStatus: true },
    );

    Object.keys(data[0]).forEach((f) => {
        if (addedFields[f]) {
            return;
        }

        if (unsupportedFields.indexOf(f) > -1) {
            columns.push({
                field: f,
                cellEditable: false,
                footerEditable: false,
                hasError: true,
                headerTemplate: unsupportedFieldTemplate,
            });
            return;
        }

        const col = colMapping[f];

        if (col) {
            const { schema: { type, system } = {} as any } = col;
            const fieldType = type === 'array' ? system : type;

            addedFields[f] = true;
            columns.push({
                field: col.key,
                displayText: col.name,
                fieldType,
                custom: col.custom,
                headerEditable: false,
                ...settings,
            });
        } else {
            columns.push({
                field: f,
                cellEditable: false,
                footerEditable: false,
                hasError: true,
                headerTemplate: invalidHeaderTemplate,
            });
        }
    });

    columns.push(defaultColumns[defaultColumns.length - 1]);

    const importData = repeatIssuesWithMultiValues(data).map(convertDataForDisplay.bind(addedFields));

    return { columns, importData, addedFields };
}

export function repeatIssuesWithMultiValues(issues: any[]): any[] {
    const result: any[] = [];
    issues.forEach((issue) => {
        if (!issue.issuekey && (issue.parent || issue.project)) {
            const parents = distinct(
                (issue.parent || '')
                    .trim()
                    .toUpperCase()
                    .split(/[ ;,]/gi)
                    .filter((p: string) => !!p),
                (p: string) => p,
            );
            const projects = distinct(
                (issue.project || '')
                    .trim()
                    .toUpperCase()
                    .split(/[ ;,]/gi)
                    .filter((p: string) => !!p),
                (p: string) => p,
            ).filter((p: string) => parents.find((i: string) => !i.toUpperCase().startsWith(`${p.toUpperCase()}-`)));
            let added = false;

            if (parents.length > 1 || (parents.length && projects.length)) {
                if (parents.length) {
                    parents.forEach((parent: string) => result.push({ ...issue, parent, project: parent.split('-')[0] }));
                    delete issue.parent;
                    added = true;
                }

                if (projects.length) {
                    projects.forEach((project: string) => result.push({ ...issue, project }));
                    added = true;
                }

                if (added) {
                    return;
                }
            }
        }

        result.push(prepareParentAndProjectFields(issue));
    });

    return result;
}

export function prepareParentAndProjectFields(issue: any): any {
    const ticket = { ...issue };

    Object.keys(ticket).forEach((f) => {
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
        project = issuekey.split('-')[0].toUpperCase();
        ticket.project = project;
    }

    if (ticket.parent) {
        ticket.parent = ticket.parent.trim().toUpperCase();
        if (!project) {
            project = ticket.parent.split('-')[0].toUpperCase();
            ticket.project = project;
        }
    }

    return ticket;
}

function convertDataForDisplay(this: Record<string, boolean>, issue: any): any {
    const addedFields = this;
    const result: any = Object.keys(issue).reduce(
        (obj: any, key: string) => {
            const value = issue[key]?.trim();
            if (value && addedFields[key]) {
                if (key === 'delete' || key === 'clone') {
                    obj[key] = value === '1' || value.toLowerCase() === 'yes' || value.toLowerCase() === 'true';
                } else {
                    const finalValue = key === 'issuekey' ? value.toUpperCase() : value;
                    obj[key] = finalValue === 'null' ? { clearValue: true } : { value: finalValue };
                }
            }

            return obj;
        },
        {
            selected: true,
            disabled: false,
            raw: issue,
            issuekey: {},
            parent: {},
            project: {},
            issuetype: {},
        },
    );

    if (result.delete && result.clone) {
        delete result.delete;
    }

    return result;
}
