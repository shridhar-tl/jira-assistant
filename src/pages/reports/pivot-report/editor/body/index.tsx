import { Button, DateRangePicker, TextInput } from '@components';
import type { ComponentEvent } from '@components';

import { DateTimePicker, MultiValueText } from '@controls';

import { updateParameters, usePivotConfig, useReportData } from '../../store/pivot-config';
import { fromPickerValue, toPickerValue } from '../../utils/date-range';
import { generateReport } from '../../viewer/generator';

import GroupTable from './group-table';
import ReportInfo from './ReportInfo';

export default function EditorBody() {
    const hasReportData = useReportData(({ reportData }) => !!reportData);
    const hasNoRows = useReportData(({ reportData }) => !!reportData && !reportData.body.length);
    const reportErrors = useReportData(({ reportErrors }) => reportErrors);
    const isFetching = useReportData(({ isFetching }) => isFetching);
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

function ReportParameters() {
    const parameters = usePivotConfig(({ parameters }) => parameters);

    if (!parameters) {
        return null;
    }

    const keys = Object.keys(parameters);

    return (
        <div className="m-3 rounded-lg border border-(--border-primary) bg-(--bg-secondary) p-4 sm:m-4">
            <div className="mb-4 flex items-center gap-2">
                <span className="fa fa-list-check text-(--primary-color)" />
                <strong className="text-sm text-(--text-primary)">Provide values for the report parameters</strong>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {keys.map((key) => (
                    <label key={key} className="flex min-w-0 flex-col gap-1.5">
                        <span className="text-xs font-semibold text-(--text-secondary)">{parameters[key].name}</span>
                        <ParameterControl {...parameters[key]} paramKey={key} />
                    </label>
                ))}
            </div>
            <div className="mt-4 flex sm:justify-end">
                <Button
                    leftIcon={<span className="fa fa-play" />}
                    onClick={generateReport}
                    className="w-full justify-center sm:w-auto"
                    label="Generate report"
                />
            </div>
        </div>
    );
}

interface ParameterControlProps {
    type: string;
    isArray?: boolean;
    name: string;
    paramKey: string;
}

function ParameterControl({ type, isArray, paramKey }: ParameterControlProps) {
    const parameters = usePivotConfig(({ parameters }) => parameters);
    const value = parameters?.[paramKey]?.value;

    const setValue = (newValue: unknown) => {
        if (!parameters) return;
        const param = parameters[paramKey];
        updateParameters({
            ...parameters,
            [paramKey]: {
                name: param?.name || '',
                type: param?.type || 'string',
                isArray: param?.isArray,
                value: newValue,
            },
        });
    };

    const handleChange = (e: ComponentEvent<unknown>) => setValue(e.value);

    switch (type) {
        default:
            if (isArray) {
                return <MultiValueText value={value} onChange={setValue} />;
            } else {
                return <TextInput value={value} onChange={handleChange} />;
            }
        case 'daterange':
            return <DateRangePicker value={toPickerValue(value)} onChange={(e) => setValue(fromPickerValue(e))} />;
        case 'datetime':
            return <DateTimePicker value={value} onChange={setValue} showTime={true} />;
        case 'date':
            return <DateTimePicker value={value} onChange={setValue} showTime={false} />;
    }
}
