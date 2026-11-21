import { useCallback } from 'react';

import { RapidViewList, toAgileBoards, toSelectedBoards, type AgileBoard } from '@components';

import type { ParameterRuntimeUIProps } from '@components/report-builder';
import type { RapidView } from '@components/shared/RapidViewList';

export default function BoardsParameter({ value, onChange, allowMultiple }: ParameterRuntimeUIProps) {
    const boards = toAgileBoards(value);
    const handleChange = useCallback(
        (next: RapidView | RapidView[] | null) => {
            const selected: AgileBoard[] = toSelectedBoards(next);
            onChange(selected.length ? selected : undefined);
        },
        [onChange],
    );

    return (
        <RapidViewList
            value={allowMultiple ? boards : (boards[0] ?? null)}
            onChange={handleChange}
            multiple={allowMultiple}
            placeholder={allowMultiple ? 'Select agile boards' : 'Select an agile board'}
        />
    );
}
