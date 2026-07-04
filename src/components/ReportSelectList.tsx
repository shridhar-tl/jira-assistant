import React from 'react';

import { useNavigate } from 'react-router-dom';

import { create } from 'zustand';

import { ComponentEvent, Dropdown } from 'fluxo-ui';

import { inject } from '../services';

interface ReportSelectListProps {
    reportId?: string;
    reportType: string;
    reportPath: string;
}

const useRefreshSignal = create<{ version: number }>(() => ({ version: 0 }));

export function notifyReportsListChanged() {
    useRefreshSignal.setState((s) => ({ version: s.version + 1 }));
}

function ReportSelectList({ reportId, reportType, reportPath }: ReportSelectListProps) {
    const [reportsList, setList] = React.useState<Array<{ value: number; label: string }>>();
    const version = useRefreshSignal((s) => s.version);
    const navigate = useNavigate();

    React.useEffect(() => {
        let active = true;
        getReportsList(reportType).then((list) => {
            if (active) {
                setList(list);
            }
        });

        return () => {
            active = false;
        };
    }, [reportType, version]);

    const changeHandler = React.useCallback(
        (e: ComponentEvent<any>) => {
            const reportId: number = parseInt(e.value);
            if (reportId) {
                navigate(`${reportPath}/${reportId}`);
            }
        },
        [navigate, reportPath],
    );

    if (!reportsList?.length) {
        return null;
    }

    return (
        <div style={{ width: '220px' }}>
            <Dropdown
                className="report-picker"
                size="sm"
                options={reportsList}
                value={parseInt(reportId || '0')}
                onChange={changeHandler}
                placeholder="Select a report to edit"
            />
        </div>
    );
}

export default ReportSelectList;

async function getReportsList(reportType: string) {
    const { $report } = inject('ReportService');

    const result = await $report.getReportsList();

    const reportsList = result.filter((q: any) => q.reportType === reportType).map((q: any) => ({ value: q.id, label: q.queryName }));

    return reportsList;
}
