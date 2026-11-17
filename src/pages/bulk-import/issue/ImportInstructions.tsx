import type { ReactNode } from 'react';

import classNames from 'classnames';

interface SectionProps {
    title: string;
    icon: string;
    open?: boolean;
    children: ReactNode;
}

interface ExampleProps {
    title: string;
    description: ReactNode;
    headers: string[];
    rows: string[][];
}

interface RuleItem {
    label: string;
    text: ReactNode;
}

const actionRules: RuleItem[] = [
    { label: 'Issue Key is empty', text: 'A new issue is created. Project (or Parent), Issue Type and Summary are needed.' },
    {
        label: 'Issue Key is filled',
        text: 'The issue is updated. Only the cells you fill are changed. Empty cells keep the current value.',
    },
    { label: 'Issue Key + Clone = yes', text: 'A copy of the issue is created. Filled cells override the values of the copy.' },
    { label: 'Issue Key + Delete = yes', text: 'The issue is deleted permanently along with its sub-tasks.' },
];

const valueRules: RuleItem[] = [
    { label: 'Keep current value', text: 'Leave the cell empty' },
    {
        label: 'Clear a value',
        text: (
            <>
                Type <Code>null</Code>
            </>
        ),
    },
    {
        label: 'Multiple values',
        text: (
            <>
                Separate with semicolon: <Code>backend; api</Code>
            </>
        ),
    },
    { label: 'Users', text: 'Email address, username or full name' },
    {
        label: 'Dates',
        text: (
            <>
                <Code>2026-11-30</Code> or <Code>2026-11-30 14:30</Code> for date & time fields
            </>
        ),
    },
    { label: 'Select lists, priority, versions, components', text: 'Name of the value as shown in Jira' },
    { label: 'Cascading select', text: <Code>Parent &gt; Child</Code> },
    { label: 'Sprint', text: 'Sprint name or sprint id' },
    {
        label: 'Estimates',
        text: (
            <>
                <Code>3d 4h 30m</Code> in Original Estimate or Remaining Estimate columns
            </>
        ),
    },
    { label: 'Status', text: 'Target status name. Issue is moved using the workflow, so the transition must be allowed.' },
    { label: 'Comment', text: 'Adds the text as a new comment' },
];

const examples: ExampleProps[] = [
    {
        title: 'Same sub-tasks under many stories',
        description: 'Put all parent keys in one Parent cell. One sub-task is created under each parent.',
        headers: ['Issue Type', 'Parent', 'Summary'],
        rows: [
            ['Sub-task', 'PROJ-101; PROJ-102; PROJ-103', 'Write unit tests'],
            ['Sub-task', 'PROJ-101; PROJ-102; PROJ-103', 'Code review'],
        ],
    },
    {
        title: 'Same change to many issues',
        description: 'Put all issue keys in one Issue Key cell. Every issue gets the same values.',
        headers: ['Issue Key', 'Priority', 'Labels', 'Status', 'Comment'],
        rows: [['PROJ-201; PROJ-202; PROJ-203', 'High', 'release-2', 'In Progress', 'Picked for release 2']],
    },
    {
        title: 'Copy a template issue under many parents',
        description: 'Clone an existing sub-task (with its description, labels, etc.) under new parents.',
        headers: ['Issue Key', 'Clone', 'Parent'],
        rows: [['PROJ-301', 'yes', 'PROJ-110; PROJ-111']],
    },
    {
        title: 'Same issue in many projects',
        description: 'Put all project keys in one Project cell. One issue is created in each project.',
        headers: ['Project', 'Issue Type', 'Summary'],
        rows: [['PROJ; OPS; QA', 'Task', 'Update the release checklist']],
    },
];

function Code({ children }: { children: ReactNode }) {
    return <code className="px-1 py-0.5 rounded bg-(--bg-tertiary) text-(--text-primary) text-xs font-mono">{children}</code>;
}

function Section({ title, icon, open, children }: SectionProps) {
    return (
        <details className="group rounded-xl border border-(--border-primary) bg-(--bg-primary) overflow-hidden" open={open}>
            <summary
                className="flex items-center gap-2 px-4 py-3 cursor-pointer text-sm font-semibold text-(--text-primary)
                hover:bg-(--bg-hover) transition-colors list-none [&::-webkit-details-marker]:hidden"
            >
                <i className={classNames('fa w-4 text-center text-(--color-primary-600)', icon)} />
                <span>{title}</span>
                <i className="fa fa-chevron-right text-xs ml-auto text-(--text-tertiary) transition-transform group-open:rotate-90" />
            </summary>
            <div className="px-4 pb-4 pt-1 text-sm text-(--text-secondary)">{children}</div>
        </details>
    );
}

function RuleList({ items }: { items: RuleItem[] }) {
    return (
        <dl className="grid grid-cols-1 sm:grid-cols-[minmax(0,14rem)_1fr] gap-x-4 gap-y-2">
            {items.map(({ label, text }) => (
                <div key={label} className="contents">
                    <dt className="font-medium text-(--text-primary)">{label}</dt>
                    <dd className="mb-1 sm:mb-0">{text}</dd>
                </div>
            ))}
        </dl>
    );
}

function Example({ title, description, headers, rows }: ExampleProps) {
    return (
        <div className="rounded-lg border border-(--border-primary) p-3 min-w-0">
            <p className="font-medium text-(--text-primary)">{title}</p>
            <p className="mb-2">{description}</p>
            <div className="overflow-x-auto">
                <table className="text-xs border-collapse min-w-full">
                    <thead>
                        <tr>
                            {headers.map((h) => (
                                <th
                                    key={h}
                                    className="text-left px-2 py-1 bg-(--bg-tertiary) border border-(--border-primary) font-semibold whitespace-nowrap"
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, ri) => (
                            <tr key={ri}>
                                {row.map((cell, ci) => (
                                    <td key={ci} className="px-2 py-1 border border-(--border-primary) font-mono whitespace-nowrap">
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ImportInstructions() {
    return (
        <div className="flex flex-col gap-3">
            <Section title="How to use" icon="fa-info-circle" open>
                <ol className="list-decimal pl-5 space-y-1.5">
                    <li>
                        Click <strong>Download Template</strong> and fill one issue per line. You can also export a list from Excel or
                        Google Sheets as CSV, or use <strong>Load by JQL</strong> to edit existing issues directly here.
                    </li>
                    <li>
                        Click <strong>Upload CSV</strong>. Every row is checked against your Jira: projects, issue types, required fields,
                        users, allowed values, workflow transitions and permissions. Nothing is changed in Jira yet.
                    </li>
                    <li>
                        Fix the cells marked in red directly in the grid (double click a cell to edit). Hover over a cell or status to see
                        the reason. Changes are validated again immediately.
                    </li>
                    <li>
                        Review the <strong>Import Status</strong> column, select the rows and click <strong>Import</strong>.
                    </li>
                </ol>
                <div className="mt-3">
                    <RuleList items={actionRules} />
                </div>
            </Section>

            <Section title="Shortcuts for bulk work" icon="fa-magic">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {examples.map((example) => (
                        <Example key={example.title} {...example} />
                    ))}
                </div>
                <ul className="list-disc pl-5 mt-3 space-y-1">
                    <li>
                        In the grid, select one or more cells and double click the small square at the bottom right corner of the selection
                        to repeat the values in all the rows below.
                    </li>
                    <li>
                        Use <Code>Ctrl+C</Code>, <Code>Ctrl+X</Code>, <Code>Ctrl+V</Code> to copy or move values between cells and{' '}
                        <Code>Delete</Code> to empty the selected cells.
                    </li>
                    <li>
                        Use <strong>Add Field</strong> to add a column for any field, and <strong>Load by JQL</strong> to pull existing
                        issues for a bulk update.
                    </li>
                </ul>
            </Section>

            <Section title="How to write values" icon="fa-pen-to-square">
                <RuleList items={valueRules} />
            </Section>

            <Section title="Column headers" icon="fa-columns">
                <ul className="list-disc pl-5 space-y-1">
                    <li>
                        Use the field name as shown in Jira (e.g. <Code>Story Points</Code>) or the field id (e.g.{' '}
                        <Code>customfield_10016</Code>). Case, spaces and symbols are ignored, so <Code>Fix Version</Code> and{' '}
                        <Code>fixversions</Code> both work.
                    </li>
                    <li>
                        <Code>Epic</Code> or <Code>Parent</Code> sets the parent of the issue. In Jira versions using Epic Link, the epic
                        link is set automatically.
                    </li>
                    <li>Required fields of the selected issue types are added as columns automatically.</li>
                    <li>
                        Not supported: attachments, issue links, watchers, votes and worklogs (use <strong>Bulk Import Worklog</strong>).
                        Such columns are struck out and ignored.
                    </li>
                </ul>
            </Section>

            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20 px-4 py-3">
                <div className="flex gap-2 text-sm text-amber-800 dark:text-amber-300">
                    <i className="fa fa-exclamation-triangle mt-0.5 shrink-0" />
                    <span>
                        Imports cannot be undone in Jira and deleted issues cannot be recovered. Use <strong>Export</strong> to save the
                        grid (including your edits) as CSV to reuse it later.
                    </span>
                </div>
            </div>
        </div>
    );
}

export default ImportInstructions;
