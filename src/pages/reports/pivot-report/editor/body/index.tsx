import { useReportData } from '../../store/pivot-config';

import GroupTable from './group-table';
import ReportParameters from './parameters/ReportParameters';
import ReportInfo from './ReportInfo';

export default function EditorBody() {
    const hasReportData = useReportData(({ reportData }) => !!reportData);
    const hasNoRows = useReportData(({ reportData }) => !!reportData && !reportData.body.length);
    const reportErrors = useReportData(({ reportErrors }) => reportErrors);
    const isFetching = useReportData(({ isFetching }) => isFetching);
    const isLoadingReport = useReportData(({ isLoadingReport }) => !!isLoadingReport);
    const showParameters = useReportData(({ showParameters }) => showParameters);

    if (isFetching) {
        return (
            <div className="flex h-full items-center justify-center p-6">
                <div className="flex max-w-md flex-col items-center gap-3 text-center">
                    <span className="fa fa-spinner fa-spin text-2xl text-(--primary-color)" />
                    <strong className="text-sm text-(--text-primary)">Pulling the issues from Jira...</strong>
                    <span className="text-xs text-(--text-secondary)">
                        This may take a while depending on the number of issues being pulled.
                    </span>
                </div>
            </div>
        );
    }

    if (isLoadingReport) {
        return (
            <div className="flex h-full items-center justify-center p-6">
                <span className="fa fa-spinner fa-spin text-2xl text-(--primary-color)" title="Loading the report..." />
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col">
            {reportErrors && <ReportErrorsSummary errors={reportErrors} />}
            {showParameters && <ReportParameters />}
            {hasNoRows && !showParameters && <NoIssuesFound />}
            {hasReportData && !hasNoRows && <GroupTable />}
            {!hasReportData && !showParameters && <ReportInfo />}
        </div>
    );
}

function NoIssuesFound() {
    return (
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <span className="fa fa-magnifying-glass text-3xl text-(--text-tertiary)" />
            <strong className="text-base text-(--text-primary)">No issues found</strong>
            <span className="max-w-md text-sm text-(--text-secondary)">
                None of the issues pulled from Jira matched the report definition. Verify the JQL, the selected sprints and the filters used
                in the fields.
            </span>
        </div>
    );
}

interface ReportErrorsSummaryProps {
    errors: string[];
}

function ReportErrorsSummary({ errors }: ReportErrorsSummaryProps) {
    return (
        <div className="m-3 rounded-lg border border-(--color-error) bg-(--bg-secondary) p-4 sm:m-4" role="alert">
            <div className="flex items-start gap-3">
                <span className="fa fa-circle-exclamation mt-0.5 text-(--color-error)" />
                <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-semibold text-(--text-primary)">Unable to generate the report</h2>
                    <p className="mt-1 text-xs text-(--text-secondary)">Fix the following in the report definition and try again.</p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-(--text-primary)">
                        {errors.map((e, i) => (
                            <li key={i} className="whitespace-pre-wrap break-words">
                                {e}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
