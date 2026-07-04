import { DateRangePicker } from 'fluxo-ui';

import { Button, TextInput } from '@components';

import { DateTimePicker, MultiValueText } from '@controls';

import { updateParameters, usePivotConfig, useReportData } from '../../store/pivot-config';
import { generateReport } from '../../viewer/generator';

import GroupTable from './group-table';
import ReportInfo from './ReportInfo';

export default function EditorBody() {
    const hasReportData = useReportData(({ reportData }) => !!reportData);
    const reportErrors = useReportData(({ reportErrors }) => reportErrors);
    const isFetching = useReportData(({ isFetching }) => isFetching);
    const showParameters = useReportData(({ showParameters }) => showParameters);

    if (isFetching) {
        return (
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <span className="fa fa-spinner fa-spin text-blue-600" />
                    <strong>
                        Please wait while the data is being pulled from Jira. This may take a while depending on the number of issues being
                        pulled.
                    </strong>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {reportErrors && <ReportErrorsSummary errors={reportErrors} />}
            {showParameters && <ReportParameters />}
            {hasReportData && <GroupTable />}
            {!hasReportData && !showParameters && <ReportInfo />}
        </div>
    );
}

interface ReportErrorsSummaryProps {
    errors: string[];
}

function ReportErrorsSummary({ errors }: ReportErrorsSummaryProps) {
    return (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <h2 className="text-xl font-semibold mb-2 text-red-800 dark:text-red-200">Report Definition Error</h2>
            <p className="mb-3 text-sm">The report definition has one or more errors. Please fix it before you try to generate report</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
                {errors.map((e, i) => (
                    <li key={i}>{e}</li>
                ))}
            </ul>
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
        <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
            <strong className="block mb-4">Provide values for missing parameters to generate report:</strong>
            <div className="space-y-4">
                {keys.map((key) => (
                    <div key={key} className="flex items-center gap-3">
                        <label className="font-semibold min-w-40">{parameters[key].name}:</label>
                        <div className="flex-1">
                            <ParameterControl {...parameters[key]} paramKey={key} />
                        </div>
                    </div>
                ))}
            </div>
            <Button leftIcon={<span className="fa fa-refresh" />} onClick={generateReport} className="mt-4">
                Generate Report
            </Button>
        </div>
    );
}

interface ParameterControlProps {
    type: string;
    isArray?: boolean;
    name: string;
    paramKey: string;
}

function ParameterControl({ type, isArray, name, paramKey }: ParameterControlProps) {
    const parameters = usePivotConfig(({ parameters }) => parameters);
    const value = parameters?.[paramKey]?.value;

    const handleChange = (e: any) => {
        const newValue = e.value;
        if (!parameters) return;
        const param = parameters[paramKey];
        const updated = {
            ...parameters,
            [paramKey]: {
                name: param?.name || '',
                type: param?.type || 'string',
                isArray: param?.isArray,
                value: newValue,
            },
        };
        updateParameters(updated);
    };

    switch (type) {
        default:
            if (isArray) {
                return <MultiValueText value={value} onChange={handleChange} />;
            } else {
                return <TextInput value={value} onChange={handleChange} />;
            }
        case 'daterange':
            return <DateRangePicker value={value} onChange={handleChange} />;
        case 'datetime':
            return <DateTimePicker value={value} onChange={handleChange} showTime={true} />;
        case 'date':
            return <DateTimePicker value={value} onChange={handleChange} showTime={false} />;
        case 'usergroup':
            return <span className="text-blue-600 cursor-pointer">Select users</span>;
    }
}
