function SprintReportInfo() {
    return (
        <div className="p-6 space-y-4">
            <details className="group rounded-xl border border-amber-200 dark:border-amber-800 overflow-hidden" open>
                <summary
                    className="flex items-center gap-2 px-5 py-3 cursor-pointer
                    bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50
                    text-sm font-semibold text-amber-800 dark:text-amber-300 transition-colors
                    list-none [&::-webkit-details-marker]:hidden"
                >
                    <i className="fa fa-flask" />
                    <span>Experimental Notice</span>
                    <i className="fa fa-chevron-right text-xs ml-auto transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-5 py-4 bg-amber-50/50 dark:bg-amber-950/20 border-t border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-secondary">
                        This report is currently in an experimental phase and is under active development. If you encounter any issues or
                        have suggestions for improvement, click the <i className="fa fa-phone mx-1" /> icon in the top-right corner to
                        share your feedback.
                    </p>
                </div>
            </details>

            <details className="group rounded-xl border border-blue-200 dark:border-blue-800 overflow-hidden">
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
                                <strong>Rapid View</strong> refers to the name of the Agile board that contains the sprint.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                Select one or more Rapid Views from the list. You can also start typing the board ID or name to filter the
                                list.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                For boards you access frequently, add them under{' '}
                                <strong>Settings &rarr; General &rarr; Default Values</strong> for quicker access.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>Once Rapid Views are selected, the sprint field will populate with available sprints.</span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>Use the dropdown or type the sprint name to filter and select one or more sprints.</span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                After selecting sprints, click <strong>Generate Report</strong> to produce the report.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                Enable the <strong>Worklog</strong> option to view individual user worklogs for each ticket, organized by
                                sprint, issue type, and ticket.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                Add at least two sprints to view the velocity chart. For more meaningful chart data, include five or more
                                sprints.
                            </span>
                        </li>
                    </ul>
                </div>
            </details>
        </div>
    );
}

export default SprintReportInfo;
