import classNames from 'classnames';

import { stop } from '@/utils';

import { Button } from '@components';


import type { ImportColumn } from '../types';

interface ColumnHeaderProps {
    column: ImportColumn;
    onRemove?: () => void;
}

function getTooltip({ header, definition, field, invalid, warning }: ImportColumn): string {
    const mapping =
        definition && definition.name !== header
            ? `${header} → ${definition.name} (${field})`
            : `${header || field}${definition ? ` (${field})` : ''}`;
    return [mapping, invalid, warning].filter(Boolean).join('\n');
}

function ColumnHeader({ column, onRemove }: ColumnHeaderProps) {
    const { header, invalid, warning } = column;

    const handleRemove = (e: React.MouseEvent) => {
        stop(e);
        onRemove?.();
    };

    return (
        <span className="flex items-center gap-1 min-w-0" title={getTooltip(column)}>
            <span className={classNames('truncate', { 'line-through text-(--text-tertiary)': invalid })}>{header}</span>
            {!!invalid && <i className="fa fa-ban text-red-500 shrink-0" />}
            {!invalid && !!warning && <i className="fa fa-exclamation-triangle text-amber-500 shrink-0" />}
            {!!onRemove && (
                <Button
                    size="xs"
                    layout="plain"
                    variant="danger"
                    className="ml-auto shrink-0 cursor-pointer"
                    title="Remove this column"
                    ariaLabel="Remove this column"
                    leftIcon={<i className="fa fa-times" />}
                    onMouseDown={stop}
                    onClick={handleRemove}
                />
            )}
        </span>
    );
}

export default ColumnHeader;
