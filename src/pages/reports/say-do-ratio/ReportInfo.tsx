import { isPluginBuild } from '@/constants/build-info';

function ReportInfo() {
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
                                The Say-Do Ratio report summarizes achievements within each sprint and tracks progress over time.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                Click the <i className="fa fa-edit mx-1" /> icon in the top-right corner to open the report configuration
                                panel.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                <strong>Select Sprint Boards:</strong> Choose one or more boards for which you want to view the report.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                <strong>Number of Sprints to Display:</strong> Specify how many completed sprints to include. The minimum
                                allowed is <strong>3</strong>.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                <strong>Sprints for Velocity:</strong> Set the number of sprints used for velocity calculations (min{' '}
                                <strong>3</strong>, max <strong>9</strong>).
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                <strong>Include Non-Working Days:</strong> Toggle whether non-working days (from General settings) are
                                included in cycle time calculations.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                Once configured, click <strong>Generate Report</strong>. Expect potential delays depending on the number of
                                boards and sprints selected.
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
                    <i className="fa fa-table" />
                    <span>Report Structure</span>
                    <i className="fa fa-chevron-right text-xs ml-auto transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-5 py-4 bg-emerald-50/50 dark:bg-emerald-950/20 border-t border-emerald-200 dark:border-emerald-800">
                    <ul className="space-y-2 text-sm text-secondary">
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-emerald-400 shrink-0" />
                            <span>
                                The report displays a comprehensive table summarizing all boards and sprints, along with individual charts
                                per board.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-emerald-400 shrink-0" />
                            <span>
                                <strong>Board Name:</strong> The name of the selected Agile board.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-emerald-400 shrink-0" />
                            <span>
                                <strong>Velocity:</strong> Expected velocity for the upcoming sprint based on completed story points.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-emerald-400 shrink-0" />
                            <span>
                                <strong>Say-Do Ratio:</strong> The average Say-Do Ratio across all sprints included in the report.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-emerald-400 shrink-0" />
                            <span>
                                <strong>Cycle Time:</strong> Average cycle time calculated based on the configured settings.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-emerald-400 shrink-0" />
                            <span>
                                <strong>Sprints:</strong> Each sprint is shown as a separate column displaying the average Say-Do Ratio for
                                that sprint.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-emerald-400 shrink-0" />
                            <span>
                                Export is supported in <strong>Excel</strong>, <strong>PDF</strong>, and <strong>CSV</strong> formats.
                            </span>
                        </li>
                    </ul>
                </div>
            </details>

            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 px-5 py-3">
                <div className="flex gap-2 text-sm text-amber-800 dark:text-amber-200">
                    <i className="fa fa-exclamation-triangle mt-0.5 shrink-0" />
                    <div className="space-y-2">
                        <p>
                            <strong>Important:</strong> This report uses Jira APIs that are currently in preview and may not be available
                            on all Jira instances.{' '}
                            {!isPluginBuild &&
                                'It is available for Jira Cloud users only. If the report does not work immediately, wait a few days for the rollout to reach your region.'}
                            {isPluginBuild &&
                                'If the report does not work immediately, wait a few days for the rollout to reach your region.'}
                        </p>
                        <p>
                            Accurate Say-Do Ratio calculation can be challenging if stories are removed during a sprint, as Jira does not
                            provide an API to retrieve the original sprint scope.{' '}
                            {!isPluginBuild &&
                                'A workaround using internal Jira APIs is implemented, but it is not available when using OAuth authentication.'}
                            {isPluginBuild && 'A workaround is applied for upcoming sprints, but results for in-progress sprints may not be fully accurate.'}
                        </p>
                        {!isPluginBuild && (
                            <p>Using the report with OAuth authentication has limited functionality due to the above constraints.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ReportInfo;
