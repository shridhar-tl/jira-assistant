function WorklogReportInfo() {
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
                                By default, this page generates a worklog report based on the selected <strong>date range</strong>.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                To generate a report based on <strong>sprints</strong>, click the <i className="fa fa-cogs" /> settings icon
                                to customize the data source.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                Use the <i className="fa fa-cogs" /> settings icon to access advanced options including display formatting,
                                additional columns, worklog filtering, and JQL data filtering.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                Choose a date or sprint, then click <i className="fa fa-refresh" /> refresh to load the report.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                Manage user lists by clicking the <i className="fa fa-users" /> icon in the toolbar.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                Access <strong>Settings &rarr; User Groups</strong> in the left menu to create and manage user groups for
                                future reports.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                Configure time zone settings for each user and group when adding them. Select matching options in report
                                settings as well.
                            </span>
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
                    <i className="fa fa-star" />
                    <span>What's New</span>
                    <i className="fa fa-chevron-right text-xs ml-auto transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-5 py-4 bg-emerald-50/50 dark:bg-emerald-950/20 border-t border-emerald-200 dark:border-emerald-800">
                    <ul className="space-y-2 text-sm text-secondary">
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-emerald-400 shrink-0" />
                            <span>Alternate option to view the report based on sprints instead of date range selection.</span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-emerald-400 shrink-0" />
                            <span>Option to filter or identify worklogs created after the threshold date.</span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-emerald-400 shrink-0" />
                            <span>Ability to generate a report without specifying a user group.</span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-emerald-400 shrink-0" />
                            <span>Option to pull all worklogs based on a selected project.</span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-emerald-400 shrink-0" />
                            <span>Automatic grouping of users and worklogs by project, epic, or issue type.</span>
                        </li>
                    </ul>
                </div>
            </details>

            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 px-5 py-3">
                <div className="flex gap-2 text-sm text-amber-800 dark:text-amber-200">
                    <i className="fa fa-exclamation-triangle mt-0.5 shrink-0" />
                    <span>
                        <strong>Note:</strong> Any changes made to groups or users on this page are temporary and will not be saved
                        permanently.
                    </span>
                </div>
            </div>
        </div>
    );
}

export default WorklogReportInfo;
