import { setPathValue } from 'react-controls/common/utils';
import { getPathValue } from 'src/common/utils';
import { create } from 'zustand';

export const useReportData = create(() => ({
    isFetching: false
}));

export const useFieldFilterText = create((set) => ({ searchText: '', setSearchText: (text) => set({ searchText: text }) }));

export const usePivotConfig = create(() => getBlankReportDefinition());

export const useSelectedItemConfig = create(set => ({
    itemPath: null,
    level: 0,
    selectItem: (itemPath, level) => set({ itemPath, level })
}));

export function useSelectedItem() {
    const { itemPath, level, selectItem } = useSelectedItemConfig();

    const item = usePivotConfig(state => {
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

export function updateItemByPath(item, _, { args: { itemPath } }) {
    const state = usePivotConfig.getState();
    const newState = setPathValue(state, itemPath, item);
    const { fields } = newState;

    usePivotConfig.setState({ fields });
}

export function updateParameters(parameters = {}) {
    usePivotConfig.setState({ parameters });
}

export function updateJQL(jql) {
    usePivotConfig.setState(() => ({ jql }));
}

export function updateDataSourceType(type) {
    usePivotConfig.setState(() => ({ dataSourceType: type || 1 }));
}

export function getGroupItem(item) {
    const { id, key, name, schema } = item;

    return { id, key, name, schema };
}

export function getQueryInfo(fieldsMap = {}) {
    const { jql, fields } = usePivotConfig.getState();

    mapFieldsList(fieldsMap, fields);

    return { jql, fields: Object.keys(fieldsMap) };
}

export function getBlankReportDefinition() {
    return {
        queryName: 'New Report',
        reportType: 'pivot',
        dataSourceType: 1,
        jql: '',
        fields: []
    };
}

function mapFieldsList(fieldsMap, items) {
    if (!items) { return; }

    items.forEach(f => {
        if (f.schema?.derived && f.key.includes('.')) {
            fieldsMap[f.key.split('.')[0]] = true;
        } else if (f.key) {
            fieldsMap[f.key] = true;
        }

        mapFieldsList(fieldsMap, f.subItems);
    });
}