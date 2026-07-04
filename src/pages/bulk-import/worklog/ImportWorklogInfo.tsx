function ImportWorklogInfo() {
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
                                Click <strong>Download Template</strong> to get a sample CSV file showing the expected format — columns are{' '}
                                <strong>Ticket No</strong>, <strong>Start Date</strong>, <strong>Timespent</strong>, and{' '}
                                <strong>Comment</strong>.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                Fill in your worklog entries and save the file as CSV. Time spent can be entered as hours (e.g.{' '}
                                <strong>8</strong>), hours and minutes (e.g. <strong>1h 30m</strong>), or Jira notation (e.g.{' '}
                                <strong>1w 2d 3h</strong>).
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                Click <strong>Upload CSV</strong> <i className="fa fa-upload mx-1" /> to load your file. The table will
                                populate with your worklog entries, highlighting any validation errors in red.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                <strong>Directly upload worklog to Jira</strong> checkbox — when checked, clicking{' '}
                                <strong>Upload worklogs</strong> sends the selected entries straight to Jira in real time.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                When the checkbox is <strong>unchecked</strong>, clicking <strong>Import worklogs</strong> saves the
                                entries locally as pending worklogs. You can then review and upload them to Jira later from any of the
                                following places:
                            </span>
                        </li>
                        <li className="flex gap-2 ml-4">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-300 shrink-0" />
                            <span>
                                <strong>Daywise Worklog gadget</strong> on the Dashboard — review logs day by day before uploading.
                            </span>
                        </li>
                        <li className="flex gap-2 ml-4">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-300 shrink-0" />
                            <span>
                                <strong>Worklog Pending Upload gadget</strong> on the Dashboard — shows all locally saved worklogs
                                awaiting upload.
                            </span>
                        </li>
                        <li className="flex gap-2 ml-4">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-300 shrink-0" />
                            <span>
                                <strong>Calendar module</strong> — view and upload pending worklogs in a calendar view.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                Use the checkboxes in the table to select or deselect individual rows before importing or uploading.
                                Rows with validation errors are automatically deselected.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                Click <strong>Clear</strong> to reset the table and start fresh with a new CSV file.
                            </span>
                        </li>
                    </ul>
                </div>
            </details>
        </div>
    );
}

export default ImportWorklogInfo;
