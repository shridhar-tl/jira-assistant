function HowToUseSection() {
    return (
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
                            <strong>User List:</strong> Select the list of users for whom the report needs to be generated.
                        </span>
                    </li>
                    <li className="flex gap-2">
                        <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                        <span>
                            <strong>Date Range:</strong> Choose the date range for fetching worklog details from Jira.
                        </span>
                    </li>
                    <li className="flex gap-2">
                        <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                        <span>
                            <strong>Projects:</strong> Select one or more projects to display for each user. To auto-populate, go to
                            Settings &rarr; General &rarr; Default Values tab.
                        </span>
                    </li>
                    <li className="flex gap-2">
                        <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                        <span>
                            <strong>Tickets List:</strong> Add one or more tickets separated by commas. These tickets will be listed
                            separately for comparison.
                        </span>
                    </li>
                    <li className="flex gap-2">
                        <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                        <span>
                            <strong>Estimate Type:</strong> Compare using Time Estimate or Story Points. If Story Points are selected,
                            optionally configure hours per story point.
                        </span>
                    </li>
                    <li className="flex gap-2">
                        <i className="fa fa-circle text-[4px] mt-2 text-amber-500 shrink-0" />
                        <span>
                            <strong>Note:</strong> If Story Point is disabled, configure it in Settings &rarr; General &rarr; Default Values
                            tab.
                        </span>
                    </li>
                </ul>
            </div>
        </details>
    );
}

export default HowToUseSection;
