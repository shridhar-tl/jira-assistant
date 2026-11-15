import type { ImportRow, ImportStats } from './types';
import { canImportRow, rowHasError, rowHasWarning } from './validator';

export function calculateStats(rows: ImportRow[]): ImportStats {
    const stats: ImportStats = {
        total: rows.length,
        selected: 0,
        errors: 0,
        warnings: 0,
        toCreate: 0,
        toUpdate: 0,
        toClone: 0,
        toDelete: 0,
        imported: 0,
        failed: 0,
    };

    rows.forEach((row) => {
        const { state, action } = row.status;
        if (state === 'imported') {
            stats.imported++;
            return;
        }
        if (state === 'failed') {
            stats.failed++;
        }
        if (rowHasError(row)) {
            stats.errors++;
        } else if (rowHasWarning(row)) {
            stats.warnings++;
        }
        if (!row.selected || !canImportRow(row)) {
            return;
        }
        stats.selected++;
        if (action === 'create') {
            stats.toCreate++;
        } else if (action === 'update') {
            stats.toUpdate++;
        } else if (action === 'clone') {
            stats.toClone++;
        } else if (action === 'delete') {
            stats.toDelete++;
        }
    });

    return stats;
}
