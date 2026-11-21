import { useShallow } from 'zustand/react/shallow';

import { Button } from '@components';

import { useReportParameters } from '../../../store/report-parameters';
import { generateReport } from '../../../viewer/generator';

import ParameterControl from './ParameterControl';

export default function ReportParameters() {
    const paramKeys = useReportParameters(useShallow(({ parameters }) => Object.keys(parameters)));

    if (!paramKeys.length) {
        return null;
    }

    return (
        <div className="m-3 rounded-lg border border-(--border-primary) bg-(--bg-secondary) p-4 sm:m-4">
            <div className="mb-4 flex items-center gap-2">
                <span className="fa fa-list-check text-(--primary-color)" />
                <strong className="text-sm text-(--text-primary)">Provide values for the report parameters</strong>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {paramKeys.map((paramKey) => (
                    <ParameterField key={paramKey} paramKey={paramKey} />
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

function ParameterField({ paramKey }: { paramKey: string }) {
    const name = useReportParameters(({ parameters }) => parameters[paramKey]?.name);

    return (
        <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-xs font-semibold text-(--text-secondary)">{name}</span>
            <ParameterControl paramKey={paramKey} />
        </div>
    );
}
