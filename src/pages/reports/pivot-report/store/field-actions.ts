import type { PivotFieldConfig } from '../types';

import { getGroupItem, usePivotConfig, useSelectedItemConfig } from './pivot-config';

export function addField({ item }: { item: PivotFieldConfig }, { index }: { index: number }) {
    const newRow = getGroupItem(item);

    usePivotConfig.setState(({ fields }) => {
        fields = [...fields];
        fields.splice(index, 0, newRow as PivotFieldConfig);

        return { fields };
    });
}

export function removeField(index: number) {
    usePivotConfig.setState(({ fields }) => {
        fields = [...fields];
        fields.splice(index, 1);

        return { fields };
    });
    useSelectedItemConfig.setState({ itemPath: null });
}

export function updateField(row: PivotFieldConfig, index: number) {
    usePivotConfig.setState(({ fields }) => {
        fields = [...fields];
        fields[index] = row;

        return { fields };
    });
}

export function setFields(fields: PivotFieldConfig[]) {
    usePivotConfig.setState({ fields });
}
