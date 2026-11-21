import { getIssueSearchJql, usePivotConfig, useReportData } from '../store/pivot-config';
import type { ReportData } from '../types';

import { getMaxDepth, processColumns, spanLeafHeaders } from './column-utils';
import { fetchData } from './common-utils';
import { isReportDefinitionValid } from './report-validator';
import { generateRowGroupBody, processRowField } from './row-utils';

const noSprintsAvailableMessage =
    'None of the selected sprints are available in the chosen agile boards. Select different sprints to pull the issues from Jira';

let latestRunId = 0;

export function cancelReportGeneration() {
    latestRunId++;
}

export async function generateReport() {
    const scope = isReportDefinitionValid();
    if (!scope) {
        return;
    }

    if (!validateReportParameters(scope)) {
        return;
    }

    useReportData.setState({ reportErrors: undefined, isFetching: true });
    const runId = ++latestRunId;
    const isStale = () => runId !== latestRunId;

    try {
        const jql = await getIssueSearchJql();
        if (isStale()) {
            return;
        }
        if (jql === undefined) {
            useReportData.setState({ reportErrors: [noSprintsAvailableMessage], isFetching: false, showParameters: false }, true);
            return;
        }

        const issues = await fetchData(jql, scope);
        if (isStale()) {
            return;
        }

        const reportData: ReportData = {
            header: new Array(getMaxDepth()).fill(null).map(() => []),
            body: [],
            footer: [],
        };

        generateFieldHeaders(reportData, issues);
        generateRowGroupBody(reportData, issues);

        useReportData.setState({ reportData, isFetching: false, showParameters: false }, true);
    } catch (err: any) {
        if (isStale()) {
            return;
        }

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

    spanLeafHeaders(reportData.header);
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
