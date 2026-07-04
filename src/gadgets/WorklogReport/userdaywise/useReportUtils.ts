import { useCallback, useMemo } from 'react';

import { inject } from '../../../services/injector';
import { useWorklogStore } from '../datastore';

export function useConvertSecs() {
    const { logFormat } = useWorklogStore();

    return useCallback(
        (val: number) => {
            if (!val && val !== 0) {
                return val;
            }
            const { $utils } = inject('UtilsService');
            return $utils.convertSecs(val, { format: logFormat === '1' });
        },
        [logFormat],
    );
}

export function useFormatTime() {
    return useMemo(() => {
        const { $userutils } = inject('UserUtilsService');
        return (val: Date) => $userutils.formatTime(val);
    }, []);
}
