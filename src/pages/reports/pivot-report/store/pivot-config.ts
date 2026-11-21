import { create } from 'zustand';

import { getOrderByClause, joinJql, stripOrderBy } from '@/gadgets/shared/jira-query-utils';
import { getPathValue } from '@/utils/helpers';

import { inject } from '@services';

import {
    cleanSprintSelection,
    getSprintFilterJql,
    syncBoardSelection,
    toAgileBoards,
    type AgileBoard,
    type SprintSelectionMap,
} from '@components/shared/sprint-selector';

import {
    jqlDataSource,
    sprintDataSource,
    type DateRangeSelection,
    type PivotDataSourceType,
    type PivotFieldConfig,
    type PivotReportDefinition,
    type ReportData,
} from '../types';
import { getQueryFieldsForKey } from '../utils/derived-sources';

interface ReportDataState {
    showParameters: boolean;
    isFetching: boolean;
    reportData?: ReportData;
    reportErrors?: string[];
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

export function updateJQL(jql: string) {
    usePivotConfig.setState(() => ({ jql }));
}

export function updateDataSourceType(dataSourceType: PivotDataSourceType) {
    const { sprintBoards } = usePivotConfig.getState();

    if (dataSourceType === sprintDataSource && !sprintBoards.length) {
        usePivotConfig.setState({ dataSourceType, sprintBoards: getDefaultSprintBoards() });
    } else {
        usePivotConfig.setState({ dataSourceType });
    }
}

export function updateSprintBoards(boards: AgileBoard[]) {
    const { sprintBoards, sprintSelection } = usePivotConfig.getState();

    usePivotConfig.setState({ sprintBoards: boards, sprintSelection: syncBoardSelection(sprintBoards, sprintSelection, boards) });
}

export function updateSprintSelection(sprintSelection: SprintSelectionMap) {
    usePivotConfig.setState({ sprintSelection });
}

export function getGroupItem(item: PivotFieldConfig) {
    const { id, key, name, schema } = item;

    return { id, key, name, schema };
}

export function getQueryFields(fieldsMap: Record<string, boolean> = {}, derivedKeys?: Set<string>) {
    const { fields } = usePivotConfig.getState();

    mapFieldsList(fieldsMap, fields, derivedKeys);

    return Object.keys(fieldsMap);
}

/**
 * Returns undefined when none of the selected sprints are available, as no issues can match such a selection.
 */
export async function getIssueSearchJql(): Promise<string | undefined> {
    const { dataSourceType, jql, sprintSelection } = usePivotConfig.getState();
    const userJql = jql?.trim() || '';

    if (dataSourceType !== sprintDataSource) {
        return userJql;
    }

    const sprintJql = await getSprintFilterJql(sprintSelection);
    if (!sprintJql) {
        return undefined;
    }

    const orderBy = getOrderByClause(userJql);
    const filterJql = joinJql([sprintJql, stripOrderBy(userJql)]);

    return orderBy ? `${filterJql} ${orderBy}` : filterJql;
}

export function getBlankReportDefinition(): PivotReportDefinition {
    return {
        queryName: 'New Report',
        reportType: 'pivot',
        dataSourceType: jqlDataSource,
        jql: '',
        sprintBoards: [],
        sprintSelection: {},
        fields: [],
    };
}

export function normalizeReportDefinition({ parameters: _, ...report }: PivotReportDefinition & { parameters?: unknown }): PivotReportDefinition {
    const sprintBoards = toAgileBoards(report.sprintBoards);
    const sprintSelection = report.sprintSelection && typeof report.sprintSelection === 'object' ? report.sprintSelection : {};

    return {
        ...getBlankReportDefinition(),
        ...report,
        dataSourceType: report.dataSourceType === sprintDataSource ? sprintDataSource : jqlDataSource,
        jql: typeof report.jql === 'string' ? report.jql : '',
        sprintBoards,
        sprintSelection: cleanSprintSelection(sprintSelection, sprintBoards),
        fields: Array.isArray(report.fields) ? report.fields.map(normalizeField) : [],
    };
}

/**
 * Dates are restored from string as the report definitions imported from file or synced from other storages contain dates serialized as string
 */
function normalizeField(field: PivotFieldConfig): PivotFieldConfig {
    const { subItems } = field;
    const dateRange = normalizeDateRange(field.dateRange);

    return {
        ...field,
        ...(dateRange && { dateRange }),
        ...(Array.isArray(subItems) && { subItems: subItems.map(normalizeField) }),
    };
}

function normalizeDateRange(value: unknown): DateRangeSelection | undefined {
    const range = Array.isArray(value) ? { fromDate: value[0], toDate: value[1] } : (value as Partial<DateRangeSelection> | undefined);
    const { fromDate, toDate } = range || {};

    return fromDate && toDate ? { fromDate: new Date(fromDate), toDate: new Date(toDate) } : undefined;
}

function getDefaultSprintBoards(): AgileBoard[] {
    const { $session } = inject('SessionService');
    return toAgileBoards($session.CurrentUser?.rapidViews);
}

function mapFieldsList(fieldsMap: Record<string, boolean>, items?: PivotFieldConfig[], derivedKeys?: Set<string>) {
    if (!items) {
        return;
    }

    items.forEach((f) => {
        if (f.key) {
            getQueryFieldsForKey(f.key, f.schema?.derived).forEach((key) => (fieldsMap[key] = true));

            if (f.schema?.derived) {
                derivedKeys?.add(f.key);
            }
        }

        if (f.filterField) {
            getQueryFieldsForKey(f.filterField, true).forEach((key) => (fieldsMap[key] = true));
            derivedKeys?.add(f.filterField);
        }

        mapFieldsList(fieldsMap, f.subItems, derivedKeys);
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
