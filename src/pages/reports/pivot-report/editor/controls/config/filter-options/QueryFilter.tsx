import { useEffect, useRef, useState } from 'react';

import { updateItemByPath, useSelectedItemConfig } from '../../../../store/pivot-config';
import { useFieldsList } from '../../../../utils/fields';

import { validateFilterText } from './validators';

interface QueryFilterProps {
    filterText?: string;
    item?: any;
    isRow?: boolean;
}

export default function QueryFilter({ filterText, item, isRow }: QueryFilterProps) {
    const { itemPath } = useSelectedItemConfig();

    const handleChange = (value: string) => {
        if (item) {
            updateItemByPath({ ...item, filter: value }, null, { args: { itemPath, isRow } });
        }
    };

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">Filter Query:</label>
            <textarea className="w-full" value={filterText} onChange={(e) => handleChange(e.target.value)} rows={3} />
            <FilterValidator filterText={filterText} />
        </div>
    );
}

function FilterValidator({ filterText }: QueryFilterProps) {
    const [state, setState] = useState<{ isValid?: boolean; errorMessage?: string }>({});
    const fieldsMap = useFieldsList((f) => f.fieldsMap);
    const ref = useRef(fieldsMap);
    ref.current = fieldsMap;

    useEffect(() => {
        if (!filterText?.trim()) {
            setState({});
        } else {
            const scope = {
                fieldsMap: ref.current,
                fields: {},
                parameters: {},
            };
            setState(validateFilterText(filterText, scope));
        }
    }, [filterText]);

    if (state.isValid !== false) {
        return null;
    }

    return <div className="text-red-600 text-sm">{state.errorMessage}</div>;
}
