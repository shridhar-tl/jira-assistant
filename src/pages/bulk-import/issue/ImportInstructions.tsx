function ImportInstructions() {
    return (
        <div className="p-6 space-y-4">
            <details className="group rounded-xl border border-blue-200 dark:border-blue-800 overflow-hidden" open>
                <summary
                    className="flex items-center gap-2 px-5 py-3 cursor-pointer
                    bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50
                    text-sm font-semibold text-blue-800 dark:text-blue-300 transition-colors
                    list-none [&::-webkit-details-marker]:hidden"
                >
                    <i className="fa fa-info-circle" />
                    <span>How to Use</span>
                    <i className="fa fa-chevron-right text-xs ml-auto transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-5 py-4 bg-blue-50/50 dark:bg-blue-950/20 border-t border-blue-200 dark:border-blue-800">
                    <ul className="space-y-2 text-sm text-secondary">
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                Click the <strong>Download Template</strong> button to get a sample CSV file with common Jira fields.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                Fill in the CSV file with your issue data. Required fields are <strong>Project</strong>,{' '}
                                <strong>Issue Type</strong>, and <strong>Summary</strong> for new issues.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                To update existing issues, include the <strong>Issue Key</strong> column (e.g., PROJ-123).
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                Click the <i className="fa fa-upload" /> <strong>Upload CSV</strong> button to load your file.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>Review the validation results. Issues with errors will be highlighted and cannot be imported.</span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                Select the issues you want to import and click <strong>Import Selected Issues</strong>.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>You can edit values directly in the grid before importing.</span>
                        </li>
                    </ul>
                </div>
            </details>

            <details className="group rounded-xl border border-emerald-200 dark:border-emerald-800 overflow-hidden">
                <summary
                    className="flex items-center gap-2 px-5 py-3 cursor-pointer
                    bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50
                    text-sm font-semibold text-emerald-800 dark:text-emerald-300 transition-colors
                    list-none [&::-webkit-details-marker]:hidden"
                >
                    <i className="fa fa-lightbulb" />
                    <span>Advanced Features</span>
                    <i className="fa fa-chevron-right text-xs ml-auto transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-5 py-4 bg-emerald-50/50 dark:bg-emerald-950/20 border-t border-emerald-200 dark:border-emerald-800">
                    <ul className="space-y-2 text-sm text-secondary">
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-emerald-400 shrink-0" />
                            <span>
                                <strong>Clone Issues:</strong> Add a "clone" column with value "yes" to clone existing issues with updated
                                fields.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-emerald-400 shrink-0" />
                            <span>
                                <strong>Delete Issues:</strong> Add a "delete" column with value "yes" to delete issues (requires issue
                                key).
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-emerald-400 shrink-0" />
                            <span>
                                <strong>Create Subtasks:</strong> Use the "parent" column to specify the parent issue key for subtasks.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-emerald-400 shrink-0" />
                            <span>
                                <strong>Clear Field Values:</strong> Use "null" (without quotes) to clear an existing field value.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-emerald-400 shrink-0" />
                            <span>
                                <strong>Multi-value Fields:</strong> Separate multiple values with semicolons (e.g.,
                                "Label1;Label2;Label3").
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-emerald-400 shrink-0" />
                            <span>
                                <strong>Custom Fields:</strong> Use the custom field name or ID from Jira (e.g., "Story Points" or
                                "customfield_10016").
                            </span>
                        </li>
                    </ul>
                </div>
            </details>

            <details className="group rounded-xl border border-purple-200 dark:border-purple-800 overflow-hidden">
                <summary
                    className="flex items-center gap-2 px-5 py-3 cursor-pointer
                    bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-950/50
                    text-sm font-semibold text-purple-800 dark:text-purple-300 transition-colors
                    list-none [&::-webkit-details-marker]:hidden"
                >
                    <i className="fa fa-file-text" />
                    <span>Supported Fields</span>
                    <i className="fa fa-chevron-right text-xs ml-auto transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-5 py-4 bg-purple-50/50 dark:bg-purple-950/20 border-t border-purple-200 dark:border-purple-800">
                    <div className="space-y-3 text-sm text-secondary">
                        <div>
                            <p className="font-semibold text-purple-700 dark:text-purple-300 mb-1">Common Fields:</p>
                            <p className="ml-4">
                                Summary, Description, Assignee, Reporter, Priority, Status, Labels, Components, Fix Version, Affects
                                Version, Due Date, Environment, Epic Link, Sprint, Story Points
                            </p>
                        </div>
                        <div>
                            <p className="font-semibold text-purple-700 dark:text-purple-300 mb-1">Action Fields:</p>
                            <p className="ml-4">Issue Key (for updates), Project, Issue Type, Parent (for subtasks), Clone, Delete</p>
                        </div>
                        <div>
                            <p className="font-semibold text-red-700 dark:text-red-400 mb-1">Unsupported Fields:</p>
                            <p className="ml-4">Attachments, Watchers, Issue Links (in CSV), Subtasks, Votes, Worklog, Thumbnail</p>
                        </div>
                    </div>
                </div>
            </details>

            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 px-5 py-3">
                <div className="flex gap-2 text-sm text-amber-800 dark:text-amber-300">
                    <i className="fa fa-exclamation-triangle mt-0.5 shrink-0" />
                    <span>
                        <strong>Important:</strong> Always review the validation results before importing. Invalid fields or values will be
                        highlighted in red. Required fields must have values for new issues.
                    </span>
                </div>
            </div>
        </div>
    );
}

export default ImportInstructions;
