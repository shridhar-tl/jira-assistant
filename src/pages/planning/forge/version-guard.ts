import { Filter, FilterConditions, kvs } from '@forge/kvs';

import { isConditionFailure } from '../../../common/kvs-condition';

export type Transaction = ReturnType<typeof kvs.transact>;

interface VersionRow {
    version: number;
}

const versionEntity = 'pi-version';
const deletedVersion = -1;
const tombstoneOptions = { ttl: { value: 1, unit: 'DAYS' as const } };

/**
 * Applies the writes only while the record still has the version that was read (null when it did not exist), so parallel saves
 * cannot overwrite each other. Records saved before versions were tracked have no version row, which is accepted as well.
 * Returns false when another request changed the record first.
 */
export async function writeVersioned(key: string, readVersion: number | null, nextVersion: number, apply: (transaction: Transaction) => Transaction): Promise<boolean> {
    const conditions = new Filter<VersionRow>().or('version', FilterConditions.notExists()).or('version', FilterConditions.equalTo(readVersion ?? deletedVersion));
    const options = nextVersion === deletedVersion ? tombstoneOptions : undefined;
    try {
        await apply(kvs.transact())
            .set<VersionRow>(`version-${key}`, { version: nextVersion }, { entityName: versionEntity, conditions }, options)
            .execute();
        return true;
    } catch (error) {
        if (isConditionFailure(error)) {
            return false;
        }
        throw error;
    }
}

/** Keeps a short-lived marker of the delete, so a save that read the record earlier cannot bring it back. */
export function deleteVersioned(key: string, readVersion: number, apply: (transaction: Transaction) => Transaction): Promise<boolean> {
    return writeVersioned(key, readVersion, deletedVersion, apply);
}
