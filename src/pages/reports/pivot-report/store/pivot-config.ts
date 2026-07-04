import { create } from 'zustand';

import { getPathValue } from '@/utils/helpers';

import type { PivotFieldConfig, PivotReportDefinition, ReportParameters } from '../types';

interface ReportDataState {
    showParameters: boolean;
    isFetching: boolean;
    reportData?: ReportData;
    reportErrors?: string[];
}

interface ReportData {
    header: ReportCell[][][];
    body: ReportCell[][];
    footer: ReportCell[][];
}

interface ReportCell {
    value?: any;
    headerText?: string;
    tagProps?: Record<string, any>;
    renderer?: {
        Component?: any;
        props?: Record<string, any>;
    };
}

interface FieldFilterState {
    searchText: string;
    setSearchText: (text: string) => void;
}

interface SelectedItemState {
    itemPath: string | null;
    level: number;
    selectItem: (itemPath?: string, level?: number) => void;
}

export const useReportData = create<ReportDataState>(() => ({
    showParameters: false,
    isFetching: false,
}));

export const useFieldFilterText = create<FieldFilterState>((set) => ({
    searchText: '',
    setSearchText: (text: string) => set({ searchText: text }),
}));

export const usePivotConfig = create<PivotReportDefinition>(() => getBlankReportDefinition());

export const useSelectedItemConfig = create<SelectedItemState>((set) => ({
    itemPath: null,
    level: 0,
    selectItem: (itemPath?: string, level: number = 0) => set({ itemPath: itemPath || null, level }),
}));

export function useSelectedItem() {
    const { itemPath, level, selectItem } = useSelectedItemConfig();

    const item = usePivotConfig((state) => {
        if (!itemPath) {
            return null;
        }

        return getPathValue(state, itemPath);
    });

    if (!item) {
        return {};
    }

    const isRow = !item.colGroup && !level;

    return { item, itemPath, isRow, level, selectItem };
}

export function updateItemByPath(item: any, _: any, { args }: any) {
    const { itemPath } = args;
    const state = usePivotConfig.getState();
    const newState = setPathValue(state, itemPath, item);
    const { fields } = newState;

    usePivotConfig.setState({ fields });
}

export function updateParameters(parameters: ReportParameters = {}) {
    usePivotConfig.setState({ parameters });
}

export function updateJQL(jql: string) {
    usePivotConfig.setState(() => ({ jql }));
}

export function updateDataSourceType(type: number) {
    usePivotConfig.setState(() => ({ dataSourceType: type || 1 }));
}

export function getGroupItem(item: PivotFieldConfig) {
    const { id, key, name, schema } = item;

    return { id, key, name, schema };
}

export function getQueryInfo(fieldsMap: Record<string, boolean> = {}) {
    const { jql, fields } = usePivotConfig.getState();

    mapFieldsList(fieldsMap, fields);

    return { jql, fields: Object.keys(fieldsMap) };
}

export function getBlankReportDefinition(): PivotReportDefinition {
    return {
        queryName: 'New Report',
        reportType: 'pivot',
        dataSourceType: 1,
        jql: '',
        fields: [],
    };
}

function mapFieldsList(fieldsMap: Record<string, boolean>, items?: PivotFieldConfig[]) {
    if (!items) {
        return;
    }

    items.forEach((f) => {
        if (f.schema?.derived && f.key.includes('.')) {
            fieldsMap[f.key.split('.')[0]] = true;
        } else if (f.key) {
            fieldsMap[f.key] = true;
        }

        mapFieldsList(fieldsMap, f.subItems);
    });
}

function setPathValue(obj: any, path: string, value: any) {
    if (!path && !obj) {
        return value;
    }
    obj = obj || {};

    const result = Array.isArray(obj) ? [...obj] : { ...obj };

    if (path.includes('.')) {
        const idx = path.indexOf('.');
        const root = path.substring(0, idx);
        const sub = path.substring(idx + 1);

        result[root] = setPathValue(obj[root], sub, value);
    } else {
        result[path] = value;
    }

    return result;
}
