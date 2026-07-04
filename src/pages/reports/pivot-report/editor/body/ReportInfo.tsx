import { GITHUB_HOME_URL, WebSiteUrl } from '@constants/urls';

import { Link } from '@controls';

export default function ReportInfo() {
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
                            <span>Start by providing a JQL query to filter the issues you want to include in the report.</span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                Customize your report by dragging and dropping fields from the right panel into the Report Fields section.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                Display data as regular rows with grouping, or mark specific fields as <strong>Column Groups</strong> for a
                                pivot-style column layout.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>Use subgroups and filters within column groups to further refine the report content.</span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>Click the preview icon at the top of the report interface to preview your configured report.</span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                For detailed documentation, visit{' '}
                                <Link href={`${WebSiteUrl}/features/reports/pivot`}>the Pivot Report documentation</Link>.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-blue-400 shrink-0" />
                            <span>
                                To report a bug or suggest improvements, visit{' '}
                                <Link href={`${GITHUB_HOME_URL}/discussions/329`}>GitHub Discussions</Link>.
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
                    <i className="fa fa-lightbulb" />
                    <span>Upcoming Enhancements</span>
                    <i className="fa fa-chevron-right text-xs ml-auto transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-5 py-4 bg-emerald-50/50 dark:bg-emerald-950/20 border-t border-emerald-200 dark:border-emerald-800">
                    <ul className="space-y-2 text-sm text-secondary">
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-emerald-400 shrink-0" />
                            <span>Ability to sort data within each group.</span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-emerald-400 shrink-0" />
                            <span>Display of totals for each group, providing a more comprehensive summary.</span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-emerald-400 shrink-0" />
                            <span>Support for parent issues, sub-tasks, and linked issues to explore relationships and dependencies.</span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-emerald-400 shrink-0" />
                            <span>
                                Ability to pull issues based on sprints in addition to JQL queries, for more dynamic reporting.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-emerald-400 shrink-0" />
                            <span>Support for adding the Pivot Report as a gadget on your dashboard.</span>
                        </li>
                        <li className="flex gap-2">
                            <i className="fa fa-circle text-[4px] mt-2 text-emerald-400 shrink-0" />
                            <span>Chart views based on report data for richer data visualization.</span>
                        </li>
                    </ul>
                </div>
            </details>

            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 px-5 py-3">
                <div className="flex gap-2 text-sm text-amber-800 dark:text-amber-200">
                    <i className="fa fa-exclamation-triangle mt-0.5 shrink-0" />
                    <div className="space-y-1">
                        <p>
                            <strong>Please Note:</strong> This report is currently under active development and is not yet considered fully
                            stable. Manually validate the output before using it for any business purpose.
                        </p>
                        <p>
                            If you encounter unexpected errors or output that does not match your expectations, please report the issue with
                            screenshots, console error logs, and details about any custom fields involved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
