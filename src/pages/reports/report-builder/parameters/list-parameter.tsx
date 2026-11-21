import { useEffect, useState } from 'react';

import { Dropdown, Multiselect } from '@components';

import type { CustomParameterPlugin, ParameterRuntimeUIProps } from '@components/report-builder';

import { deserializeJson, serializeJson } from './parameter-values';

export interface ListParameterOption {
    value: string;
    label: string;
}

interface ListParameterDefinition {
    type: string;
    name: string;
    placeholder: string;
    loadOptions: () => Promise<ListParameterOption[]>;
}

function toList(value: unknown): string[] {
    if (Array.isArray(value)) return value.map(String);
    return value === null || value === undefined || value === '' ? [] : [String(value)];
}

export function createListParameterPlugin(definition: ListParameterDefinition): CustomParameterPlugin {
    let cache: Promise<ListParameterOption[]> | null = null;
    const getOptions = () => {
        cache ??= definition.loadOptions().catch((err: unknown) => {
            cache = null;
            throw err;
        });
        return cache;
    };

    function ListParameterUI({ id, value, onChange, allowMultiple, disabled, ariaLabel }: ParameterRuntimeUIProps) {
        const [options, setOptions] = useState<ListParameterOption[] | null>(null);

        useEffect(() => {
            let active = true;
            getOptions().then(
                (opts) => {
                    if (active) setOptions(opts);
                },
                () => {
                    if (active) setOptions([]);
                },
            );
            return () => {
                active = false;
            };
        }, []);

        if (allowMultiple) {
            return (
                <Multiselect
                    id={id}
                    options={options ?? []}
                    value={toList(value)}
                    onChange={(e) => onChange(e.value?.length ? e.value : undefined)}
                    placeholder={options ? definition.placeholder : 'Loading…'}
                    loading={!options}
                    disabled={disabled}
                    searchable
                    ariaLabel={ariaLabel}
                />
            );
        }

        return (
            <Dropdown
                id={id}
                options={options ?? []}
                value={toList(value)[0] ?? ''}
                onChange={(e) => onChange(e.value || undefined)}
                placeholder={options ? definition.placeholder : 'Loading…'}
                loading={!options}
                disabled={disabled}
                searchable
                showClear
                ariaLabel={ariaLabel}
            />
        );
    }

    return {
        type: definition.type,
        name: definition.name,
        RuntimeUI: ListParameterUI,
        initialTypeConfig: () => ({}),
        supportsMultiple: true,
        serialize: serializeJson,
        deserialize: deserializeJson,
    };
}
