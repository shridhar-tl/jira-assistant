import { usePivotConfig, useReportData } from "../store/pivot-config";
import { generateRowGroupBody, processRowField } from './row-utils';
import { getMaxDepth, processColumns } from './column-utils';
import { isReportDefinitionValid } from "./report-validator";
import { fetchData } from './common-utils';

export async function generateReport() {
    const scope = isReportDefinitionValid();
    if (!scope) {
        return;
    }

    if (!validateReportParameters(scope)) {
        return;
    }

    useReportData.setState({ reportErrors: null, isFetching: true });

    try {
        const issues = await fetchData(scope);
        const reportData = {
            header: new Array(getMaxDepth()).fill(null).map(() => []),
            body: [],
            footer: []
        };

        generateFieldHeaders(reportData, issues);
        generateRowGroupBody(reportData, issues);

        useReportData.setState({ reportData, isFetching: false }, true);
    } catch (err) {
        let reportErrors = ['Unknown error occurred while generating report. Look at console log for more details'];
        if (err.status === 400) {
            reportErrors = err.error?.errorMessages || reportErrors;
        }

        console.error('Error generating pivot report:- ', err);
        useReportData.setState({ reportErrors, isFetching: false }, true);
    }
}

function generateFieldHeaders(reportData, issues) {
    const { fields } = usePivotConfig.getState();
    const rowSpan = reportData.header.length;

    let prevRow;
    fields.forEach(field => {
        if (field.colGroup) {
            processColumns([field], reportData, issues);
        } else {
            prevRow = processRowField(field, prevRow, reportData, rowSpan);
        }
    });
}

function validateReportParameters({ parameters: list }) {
    const { parameters: values = {} } = usePivotConfig.getState();
    const { showParameters, parameters } = Object.values(list).reduce((obj, cur) => {
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
    }, { showParameters: false, parameters: {} });

    usePivotConfig.setState({ parameters });
    if (showParameters) {
        useReportData.setState({ showParameters: true }, true);
    }

    return !showParameters;
}