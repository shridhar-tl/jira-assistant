import { usePivotConfig, useReportData } from '../store/pivot-config';
import type { ReportData } from '../types';

import { getMaxDepth, processColumns } from './column-utils';
import { fetchData } from './common-utils';
import { isReportDefinitionValid } from './report-validator';
import { generateRowGroupBody, processRowField } from './row-utils';

export async function generateReport() {
    const scope = isReportDefinitionValid();
    if (!scope) {
        return;
    }

    if (!validateReportParameters(scope)) {
        return;
    }

    useReportData.setState({ reportErrors: undefined, isFetching: true });

    try {
        const issues = await fetchData(scope);
        const reportData: ReportData = {
            header: new Array(getMaxDepth()).fill(null).map(() => []),
            body: [],
            footer: [],
        };

        generateFieldHeaders(reportData, issues);
        generateRowGroupBody(reportData, issues);

        useReportData.setState({ reportData, isFetching: false, showParameters: false }, true);
    } catch (err: any) {
        let reportErrors = ['Unknown error occurred while generating report. Look at console log for more details'];
        if (err.status === 400) {
            reportErrors = err.error?.errorMessages || reportErrors;
        }

        console.error('Error generating pivot report:- ', err);
        useReportData.setState({ reportErrors, isFetching: false, showParameters: false }, true);
    }
}

function generateFieldHeaders(reportData: ReportData, issues: any[]) {
    const { fields } = usePivotConfig.getState();
    const rowSpan = reportData.header.length;

    let prevRow: any;
    fields.forEach((field) => {
        if (field.colGroup) {
            processColumns([field], reportData, issues);
        } else {
            prevRow = processRowField(field, prevRow, reportData, rowSpan);
        }
    });
}

function validateReportParameters({ parameters: list }: any) {
    const { parameters: values = {} } = usePivotConfig.getState();
    const { showParameters, parameters } = Object.values(list).reduce(
        (
            obj: { showParameters: boolean; parameters: Record<string, { name: string; type: string; isArray?: boolean; value?: any }> },
            cur: any,
        ) => {
            const paramNameLCase = cur.name.toLowerCase();
            let curParameter = values[paramNameLCase];

            if (!curParameter || curParameter.type !== cur.type || curParameter.isArray !== cur.isArray) {
                curParameter = { name: cur.name, type: cur.type, isArray: cur.isArray };
            }

            if (!curParameter.value) {
                obj.showParameters = true;
            }

            obj.parameters[paramNameLCase] = curParameter;

            return obj;
        },
        { showParameters: false, parameters: {} },
    );

    usePivotConfig.setState({ parameters });
    if (showParameters) {
        useReportData.setState({ showParameters: true, isFetching: false }, true);
    }

    return !showParameters;
}
