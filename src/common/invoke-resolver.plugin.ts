import { invoke } from '@forge/bridge';

import { ResolverError, type ResolverResult } from './resolver-result';

export async function invokeResolver<T>(functionKey: string, payload: Record<string, unknown>): Promise<T> {
    const result = (await invoke(functionKey, payload)) as ResolverResult<T> | undefined;
    if (result?.ok === true) {
        return result.value;
    }
    if (result?.ok === false) {
        throw new ResolverError(result.status, result.message);
    }
    throw new ResolverError(500, `${functionKey} returned an unexpected response.`);
}
