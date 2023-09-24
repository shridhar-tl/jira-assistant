import { getGroupItem, usePivotConfig, useSelectedItemConfig } from './pivot-config';

export function addField({ item }, { index }) {
    const newRow = getGroupItem(item);

    usePivotConfig.setState(({ fields }) => {
        fields = [...fields];
        fields.splice(index, 0, newRow);

        return { fields };
    });
}

export function removeField(index) {
    usePivotConfig.setState(({ fields }) => {
        fields = [...fields];
        fields.splice(index, 1);

        return { fields };
    });
    useSelectedItemConfig.setState({ itemPath: null });
}
/*
export function updateRowItem(row, _, { args: index }) {
    updateField(row, index);
}*/

export function updateField(row, index) {
    usePivotConfig.setState(({ fields }) => {
        fields = [...fields];
        fields[index] = row;

        return { fields };
    });
}

export function setFields(fields) {
    usePivotConfig.setState({ fields });
}