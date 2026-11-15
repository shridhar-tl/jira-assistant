import classNames from 'classnames';

import { Link } from '@/controls';

import type { ImportAction, ImportRow } from '../types';
import { rowHasError } from '../validator';

interface RowStatusCellProps {
    row: ImportRow;
    getTicketUrl: (key: string) => string | undefined;
}

const actionLabels: Record<ImportAction, { label: string; icon: string; className: string }> = {
    create: { label: 'Will create', icon: 'fa-plus-circle', className: 'text-emerald-600 dark:text-emerald-400' },
    update: { label: 'Will update', icon: 'fa-pencil', className: 'text-blue-600 dark:text-blue-400' },
    clone: { label: 'Will clone', icon: 'fa-copy', className: 'text-violet-600 dark:text-violet-400' },
    delete: { label: 'Will delete', icon: 'fa-trash', className: 'text-red-600 dark:text-red-400' },
    none: { label: 'No changes', icon: 'fa-minus-circle', className: 'text-(--text-tertiary)' },
};

const importedLabels: Record<ImportAction, string> = {
    create: 'Created',
    update: 'Updated',
    clone: 'Cloned',
    delete: 'Deleted',
    none: 'Done',
};

function collectMessages(row: ImportRow): { errors: string[]; warnings: string[] } {
    const { status, cells } = row;
    const errors = [status.error, status.conflict?.isError ? status.conflict.message : undefined].filter((m): m is string => !!m);
    const warnings = [...status.warnings, status.conflict && !status.conflict.isError ? status.conflict.message : undefined].filter(
        (m): m is string => !!m,
    );

    Object.values(cells).forEach((cell) => {
        if (cell.error) {
            errors.push(cell.error);
        } else if (cell.warning) {
            warnings.push(cell.warning);
        }
    });

    return { errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
}

function RowStatusCell({ row, getTicketUrl }: RowStatusCellProps) {
    const { status } = row;
    const { errors, warnings } = collectMessages(row);
    const tooltip = [...errors, ...warnings].join('\n') || undefined;

    if (status.validating) {
        return (
            <span className="inline-flex items-center gap-1.5 text-(--text-secondary)">
                <i className="fa fa-spinner fa-spin" /> Validating
            </span>
        );
    }

    if (status.state === 'importing') {
        return (
            <span className="inline-flex items-center gap-1.5 text-(--color-primary-600)">
                <i className="fa fa-spinner fa-spin" /> Importing
            </span>
        );
    }

    if (status.state === 'imported') {
        const url = status.resultKey && status.action !== 'delete' ? getTicketUrl(status.resultKey) : undefined;
        return (
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400" title={tooltip}>
                <i className="fa fa-check-circle" />
                {importedLabels[status.action]}
                {(status.action === 'clone' || status.action === 'create') && url && (
                    <Link href={url} className="hover:underline cursor-pointer">
                        {status.resultKey}
                    </Link>
                )}
                {!!warnings.length && <i className="fa fa-exclamation-triangle text-amber-500" />}
            </span>
        );
    }

    if (rowHasError(row)) {
        return (
            <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400 min-w-0" title={tooltip}>
                <i className="fa fa-exclamation-circle shrink-0" />
                <span className="truncate">{errors[0] || 'Has errors'}</span>
            </span>
        );
    }

    const action = actionLabels[status.action];
    return (
        <span className={classNames('inline-flex items-center gap-1.5 min-w-0', action.className)} title={tooltip}>
            <i className={classNames('fa shrink-0', action.icon)} />
            <span className="truncate">{action.label}</span>
            {!!warnings.length && <i className="fa fa-exclamation-triangle text-amber-500 shrink-0" />}
        </span>
    );
}

export default RowStatusCell;
