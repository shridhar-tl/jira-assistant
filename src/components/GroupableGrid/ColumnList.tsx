import { useState } from 'react';

import { Checkbox, type ComponentEvent } from 'fluxo-ui';

import './GroupableGrid.css';
import type { ColumnListProps, ColumnSchema } from './types';

interface ColumnItem {
    id: string;
    displayText: string;
    selected: boolean;
}

export default function ColumnList({ columns, displayColumns, onChange }: ColumnListProps) {
    const [items, setItems] = useState<ColumnItem[]>(() =>
        columns.map(({ id, displayText }: ColumnSchema) => ({
            id,
            displayText,
            selected: !displayColumns || displayColumns.includes(id),
        })),
    );

    const hideColumns = () => {
        const selected = items.filter((c) => c.selected);
        const displayCols = selected.length === items.length ? null : selected.map((c) => c.id);
        onChange(displayCols);
    };

    const selectionChanged = (index: number, selected: boolean) => {
        const next = [...items];
        next[index] = { ...next[index], selected };
        setItems(next);
    };

    return (
        <div className="columns-list-container">
            <div className="columns-list">
                <div className="column-list-title">
                    <span className="fa fa-times" onClick={hideColumns} />
                    <span>Choose Columns</span>
                </div>
                <div className="columns-list-items">
                    {items.map((c, i) => (
                        <div key={i} className="column-list-item my-2">
                            <Checkbox
                                label={c.displayText}
                                checked={c.selected}
                                onChange={(e: ComponentEvent<boolean>) => selectionChanged(i, e.value)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
