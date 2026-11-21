import { create } from 'zustand';

import { getSelectedBoardIds } from '@components/shared/sprint-selector';

import { getUserName } from '@utils/helpers';

import type { UserGroup } from '@types';


import type {
    ParameterOption,
    ReportParameter,
    ReportParameterDefinition,
    ReportParameters,
    ReportParameterValue,
    SprintsParameterValue,
} from '../types';
import { getInitialSprintsValue, sprintsParameterType } from '../utils/sprints-parameter';

interface ReportParametersState {
    parameters: ReportParameters;
}

export const useReportParameters = create<ReportParametersState>(() => ({ parameters: {} }));

export function resetReportParameters() {
    useReportParameters.setState({ parameters: {} }, true);
}

export function setParameterValue(paramKey: string, value?: ReportParameterValue) {
    const { parameters } = useReportParameters.getState();
    const param = parameters[paramKey];

    if (!param) {
        return;
    }

    useReportParameters.setState({ parameters: { ...parameters, [paramKey]: { ...param, value } } });
}

export function syncReportParameters(definitions: Record<string, ReportParameterDefinition>): boolean {
    const { parameters: current } = useReportParameters.getState();
    const parameters: ReportParameters = {};
    let hasMissingValues = false;

    Object.values(definitions).forEach((definition) => {
        const paramKey = definition.name.toLowerCase();
        const existing = current[paramKey];
        const param: ReportParameter =
            existing && isSameDefinition(existing, definition) ? existing : { ...definition, value: getInitialValue(definition) };

        if (isEmptyParameterValue(param.value)) {
            hasMissingValues = true;
        }

        parameters[paramKey] = param;
    });

    useReportParameters.setState({ parameters }, true);

    return hasMissingValues;
}

const definitionProps: (keyof ReportParameterDefinition)[] = ['type', 'isArray', 'fieldKey', 'itemType', 'customType', 'jqlField', 'sprintRange'];

function getInitialValue(definition: ReportParameterDefinition): ReportParameterValue | undefined {
    return definition.type === sprintsParameterType ? getInitialSprintsValue(definition.sprintRange) : undefined;
}

function isSameDefinition(param: ReportParameterDefinition, definition: ReportParameterDefinition) {
    return definitionProps.every((prop) => param[prop] === definition[prop]);
}

const numberParameterTypes = ['number', 'timespent', 'size'];

export function isNumberParameter(param?: ReportParameterDefinition) {
    return !!param && (numberParameterTypes.includes(param.type) || numberParameterTypes.includes(param.itemType || ''));
}

export function isEmptyParameterValue(value?: ReportParameterValue) {
    if (isSprintsParameterValue(value)) {
        return !getSelectedBoardIds(value.selection).length;
    }

    if (Array.isArray(value) && value.every(isUserGroup)) {
        return !getGroupMembers(value).length;
    }

    return value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length);
}

export function isParameterOption(value: unknown): value is ParameterOption {
    return typeof value === 'object' && value !== null && 'value' in value && 'label' in value;
}

export function isSprintsParameterValue(value: unknown): value is SprintsParameterValue {
    return typeof value === 'object' && value !== null && Array.isArray((value as SprintsParameterValue).boards) && 'selection' in value;
}

export function isUserGroup(value: unknown): value is UserGroup {
    return typeof value === 'object' && value !== null && 'name' in value && Array.isArray((value as UserGroup).users);
}

export function getGroupMembers(groups: UserGroup[]): string[] {
    const members = groups.flatMap(({ users }) => users.map((user) => getUserName(user)).filter((name): name is string => !!name));

    return [...new Set(members)];
}

export function getParameterFilterValue(param?: ReportParameter): unknown {
    const value = param?.value;

    if (!Array.isArray(value)) {
        return value;
    }

    const values = (value as (string | ParameterOption | UserGroup)[]).flatMap((item) => {
        if (isUserGroup(item)) {
            return getGroupMembers([item]);
        }

        return isParameterOption(item) ? [item.value] : [item];
    });

    if (isNumberParameter(param)) {
        return values.map(Number).filter((v) => !Number.isNaN(v));
    }

    return param?.isArray ? values : values[0];
}
