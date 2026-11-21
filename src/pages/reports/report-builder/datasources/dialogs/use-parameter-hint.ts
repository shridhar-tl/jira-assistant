import { useMemo } from 'react';

import type { DatasourceConfigureRequest } from '@components/report-builder';

export function useParameterHint(request: DatasourceConfigureRequest): string {
    return useMemo(() => {
        const names = request.parameters.map((p) => `Parameters.${p.name}`);
        return names.length > 0 ? `Available: ${names.join(', ')}` : 'Add report parameters to make this datasource interactive.';
    }, [request]);
}
