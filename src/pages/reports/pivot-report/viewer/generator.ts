import { getIssueSearchJql, usePivotConfig, useReportData } from '../store/pivot-config';
import { syncReportParameters } from '../store/report-parameters';
import type { ReportData, ReportParameterDefinition } from '../types';
import { mergeParameterDefinitions, resolveJqlParameters } from '../utils/jql-parameters';
import { sprintsParameterKey } from '../utils/sprints-parameter';

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

    const runId = ++latestRunId;
    const isStale = () => runId !== latestRunId;

    const parameters = await collectReportParameters(scope.parameters);
    if (isStale() || !parameters || !validateReportParameters(parameters)) {
        return;
    }

    useReportData.setState({ reportErrors: undefined, isFetching: true });

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

type ParameterDefinitions = Record<string, ReportParameterDefinition>;

/**
 * Parameters of the data source are listed ahead of the parameters used within the fields
 */
async function collectReportParameters({ [sprintsParameterKey]: sprints, ...fieldParameters }: ParameterDefinitions) {
    const { jql } = usePivotConfig.getState();
    const { parameters: jqlParameters, errors } = await resolveJqlParameters(jql?.trim() || '');
    const parameters: ParameterDefinitions = sprints ? { [sprintsParameterKey]: sprints } : {};

    mergeParameterDefinitions(parameters, jqlParameters, errors);
    mergeParameterDefinitions(parameters, fieldParameters, errors);

    if (errors.length) {
        useReportData.setState({ reportErrors: errors, isFetching: false, showParameters: false }, true);
        return;
    }

    return parameters;
}

function validateReportParameters(parameters: ParameterDefinitions) {
    const hasMissingValues = syncReportParameters(parameters);

    if (hasMissingValues) {
        useReportData.setState({ showParameters: true, isFetching: false }, true);
    }

    return !hasMissingValues;
}
