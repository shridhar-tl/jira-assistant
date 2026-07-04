import { createContext, CSSProperties, ReactNode, useContext, useEffect, useRef, useState } from 'react';

import classNames from 'classnames';
import './ScrollableTable.css';

interface TableContextType {
    dataset: any[];
    sortBy: string | null;
    isDesc: boolean;
    onSort: (field: string) => void;
}

const TableContext = createContext<TableContextType | null>(null);

export interface ScrollableTableProps {
    dataset?: any[];
    sortBy?: string | null;
    isDesc?: boolean;
    onSort?: (sortBy: string, isDesc: boolean) => boolean;
    className?: string;
    style?: CSSProperties;
    containerStyle?: CSSProperties;
    height?: string;
    exportable?: boolean;
    exportSheetName?: string;
    children: ReactNode;
}

export function ScrollableTable({
    dataset: initialDataset,
    sortBy: initialSortBy = null,
    isDesc: initialIsDesc = false,
    onSort,
    className,
    style,
    containerStyle,
    height,
    exportable = true,
    exportSheetName,
    children,
}: ScrollableTableProps) {
    // Track user-initiated sort when handled internally (no parent override)
    const [internalSort, setInternalSort] = useState<{ sortBy: string | null; isDesc: boolean } | null>(null);
    // Sorted data when sorting is handled internally (not by parent via onSort)
    const [internalSorted, setInternalSorted] = useState<{ sourceRef: any[]; sorted: any[] } | null>(null);

    // Use internal sort state only when present, otherwise defer to parent-controlled props
    const sortBy = internalSort ? internalSort.sortBy : (initialSortBy ?? null);
    const isDesc = internalSort ? internalSort.isDesc : (initialIsDesc ?? false);

    // Use internal sorted data only while its source reference still matches the incoming dataset
    const dataset = (internalSorted && internalSorted.sourceRef === initialDataset ? internalSorted.sorted : initialDataset) ?? [];

    const handleSort = (field: string) => {
        const curSortBy = sortBy;
        const curIsDesc = isDesc;
        const newIsDesc = field === curSortBy ? !curIsDesc : false;

        let sortApplied = false;
        if (onSort) {
            sortApplied = onSort(field, newIsDesc);
        }

        if (!sortApplied) {
            const src = initialDataset ?? [];
            const sorted = [...src].sort((a, b) => {
                const aVal = a[field];
                const bVal = b[field];

                if (aVal < bVal) return newIsDesc ? 1 : -1;
                if (aVal > bVal) return newIsDesc ? -1 : 1;
                return 0;
            });

            setInternalSorted({ sourceRef: src, sorted });
            setInternalSort({ sortBy: field, isDesc: newIsDesc });
        }
        // When sortApplied, parent controls sortBy/isDesc via props — no local state update needed
    };

    return (
        <div className="scroll-table-container" style={containerStyle || (height ? { height } : undefined)}>
            <TableContext.Provider value={{ dataset, sortBy, isDesc, onSort: handleSort }}>
                <table
                    className={classNames('border-collapse', className, exportable && 'exportable')}
                    style={style}
                    data-export-sheet-name={exportSheetName}
                >
                    {children}
                </table>
            </TableContext.Provider>
        </div>
    );
}

interface THeadProps {
    className?: string;
    style?: CSSProperties;
    exportIgnore?: boolean;
    children: ReactNode;
}

export function THead({ className, style, exportIgnore, children }: THeadProps) {
    const ref = useRef<HTMLTableSectionElement>(null);

    useEffect(() => {
        const thead = ref.current;
        if (!thead) return;

        const updateOffsets = () => {
            const rows = thead.querySelectorAll<HTMLTableRowElement>(':scope > tr');
            let offset = 0;
            rows.forEach((row) => {
                row.querySelectorAll<HTMLTableCellElement>('th, td').forEach((cell) => {
                    cell.style.top = `${offset}px`;
                });
                offset += row.offsetHeight;
            });
        };

        updateOffsets();

        const observer = new ResizeObserver(updateOffsets);
        observer.observe(thead);
        return () => observer.disconnect();
    }, []);

    return (
        <thead ref={ref} className={className} style={style} {...(exportIgnore ? { 'data-export-ignore': 'true' } : {})}>
            {children}
        </thead>
    );
}

interface TBodyProps {
    className?: string;
    style?: CSSProperties;
    children: ReactNode | ((data: any, index: number) => ReactNode);
}

export function TBody({ className, style, children }: TBodyProps) {
    const context = useContext(TableContext);

    if (!context) {
        return null;
    }

    const { dataset } = context;

    if (typeof children === 'function') {
        if (!dataset || dataset.length === 0) {
            return null;
        }
        return (
            <tbody className={className} style={style}>
                {dataset.map((data, index) => (children as (data: any, index: number) => ReactNode)(data, index))}
            </tbody>
        );
    }

    return (
        <tbody className={className} style={style}>
            {children}
        </tbody>
    );
}

interface NoDataRowProps {
    span: number;
    children: ReactNode;
}

export function NoDataRow({ span, children }: NoDataRowProps) {
    const context = useContext(TableContext);

    if (!context) {
        return null;
    }

    const { dataset } = context;

    if (dataset && dataset.length > 0) {
        return null;
    }

    return (
        <tbody>
            <tr>
                <td colSpan={span} className="text-center py-8 text-[--text-secondary]">
                    {children}
                </td>
            </tr>
        </tbody>
    );
}

interface TRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    children: ReactNode;
}

export function TRow({ children, ...props }: TRowProps) {
    return <tr {...props}>{children}</tr>;
}

interface ColumnProps {
    sortBy?: string;
    className?: string;
    style?: CSSProperties;
    noExport?: boolean;
    rowSpan?: number;
    colSpan?: number;
    dragRef?: ((el: HTMLTableCellElement | null) => void) | null;
    children: ReactNode;
}

export function Column({ sortBy: sortField, className, style, noExport, rowSpan, colSpan, dragRef, children }: ColumnProps) {
    const context = useContext(TableContext);

    if (!context) {
        return null;
    }

    const { sortBy, isDesc, onSort } = context;
    const isDraggable = dragRef != null;

    const handleClick = () => {
        if (sortField) {
            onSort(sortField);
        }
    };

    return (
        <th
            ref={dragRef}
            className={classNames(sortField && 'cursor-pointer select-none', isDraggable && 'cursor-move', className)}
            style={style}
            onClick={handleClick}
            {...(noExport ? { 'data-no-export': 'true' } : {})}
            rowSpan={rowSpan}
            colSpan={colSpan}
        >
            <div className="flex items-center gap-2">
                {children}
                {sortField && (
                    <span
                        className={classNames('fa', {
                            'fa-sort': sortBy !== sortField,
                            'fa-sort-asc': sortBy === sortField && !isDesc,
                            'fa-sort-desc': sortBy === sortField && isDesc,
                        })}
                    />
                )}
            </div>
        </th>
    );
}
