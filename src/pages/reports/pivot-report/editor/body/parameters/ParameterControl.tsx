import { useEffect, useMemo, useState } from 'react';

import { DateRangePicker, NumericInput, SelectButton, TextInput } from '@components';

import type { UserGroup } from '@types';

import { DateTimePicker, MultiValueText } from '@controls';

import { isParameterOption, isUserGroup, setParameterValue, useReportParameters } from '../../../store/report-parameters';
import type { DateRangeSelection, ParameterOption, ReportParameter, ReportParameterValue } from '../../../types';
import { fromPickerValue, toPickerValue } from '../../../utils/date-range';

import { getOptionsLoader, getParameterKind, resolveSuggestionLoader, type OptionsLoader } from './parameter-options';
import ParameterOptionsPicker from './ParameterOptionsPicker';
import UserGroupsParameter from './UserGroupsParameter';

interface ParameterControlProps {
    paramKey: string;
}

const booleanOptions = [
    { label: 'Yes', value: 'true' },
    { label: 'No', value: 'false' },
];

export default function ParameterControl({ paramKey }: ParameterControlProps) {
    const param = useReportParameters(({ parameters }) => parameters[paramKey]);
    const kind = useMemo(() => (param ? getParameterKind(param) : 'text'), [param]);
    const isArray = !!param?.isArray;
    const loadOptions = useMemo(() => getOptionsLoader(kind), [kind]);

    if (!param) {
        return null;
    }

    const { value } = param;
    const setValue = (newValue?: ReportParameterValue) => setParameterValue(paramKey, newValue);

    if (kind === 'user' && isArray) {
        return <UserGroupsParameter value={asUserGroups(value)} onChange={setValue} />;
    }

    if (loadOptions) {
        return (
            <ParameterOptionsPicker
                value={asOptions(value)}
                onChange={setValue}
                loadOptions={loadOptions}
                multiple={isArray}
                placeholder={kind === 'user' ? 'Search users' : 'Search and select'}
            />
        );
    }

    switch (kind) {
        case 'daterange':
            return (
                <DateRangePicker
                    value={toPickerValue(value as DateRangeSelection | undefined)}
                    placeholder="Select the dates"
                    onChange={(e) => setValue(fromPickerValue(e))}
                />
            );
        case 'datetime':
            return <DateTimePicker value={value as Date | undefined} onChange={setValue} showTime={true} />;
        case 'date':
            return <DateTimePicker value={value as Date | undefined} onChange={setValue} showTime={false} />;
        case 'bool':
            return (
                <SelectButton
                    items={booleanOptions}
                    value={typeof value === 'boolean' ? String(value) : undefined}
                    onChange={(e) => setValue(e.value === 'true')}
                />
            );
        case 'number':
            return isArray ? (
                <TextValueControl param={param} onChange={setValue} />
            ) : (
                <NumericInput value={value as number | undefined} onChange={(e) => setValue(e.value)} />
            );
        case 'suggestion':
            return <SuggestionControl key={`${param.fieldKey}|${param.customType}`} param={param} onChange={setValue} />;
        default:
            return <TextValueControl param={param} onChange={setValue} />;
    }
}

interface ValueControlProps {
    param: ReportParameter;
    onChange: (value?: ReportParameterValue) => void;
}

function TextValueControl({ param: { value, isArray }, onChange }: ValueControlProps) {
    if (isArray) {
        return <MultiValueText value={asStrings(value)} onChange={onChange} />;
    }

    return <TextInput value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.value)} />;
}

function SuggestionControl({ param, onChange }: ValueControlProps) {
    const [loader, setLoader] = useState<OptionsLoader | null>();
    const { fieldKey, customType, isArray } = param;

    useEffect(() => {
        let isActive = true;

        resolveSuggestionLoader(fieldKey, customType)
            .catch((err) => {
                console.error('Unable to resolve the suggestions for report parameter', err);
                return null;
            })
            .then((resolved) => {
                if (isActive) {
                    setLoader(() => resolved);
                }
            });

        return () => {
            isActive = false;
        };
    }, [fieldKey, customType]);

    if (loader === undefined) {
        return (
            <div className="flex h-9 items-center gap-2 text-xs text-(--text-secondary)">
                <span className="fa fa-spinner fa-spin" /> Loading...
            </div>
        );
    }

    if (!loader) {
        return <TextValueControl param={param} onChange={onChange} />;
    }

    return <ParameterOptionsPicker value={asOptions(param.value)} onChange={onChange} loadOptions={loader} multiple={isArray} placeholder="Search and select" />;
}

function asOptions(value?: ReportParameterValue): ParameterOption[] {
    return Array.isArray(value) ? (value as unknown[]).filter(isParameterOption) : [];
}

function asUserGroups(value?: ReportParameterValue): UserGroup[] {
    return Array.isArray(value) ? (value as unknown[]).filter(isUserGroup) : [];
}

function asStrings(value?: ReportParameterValue): string[] {
    return Array.isArray(value) ? (value as unknown[]).filter((v): v is string => typeof v === 'string') : [];
}
