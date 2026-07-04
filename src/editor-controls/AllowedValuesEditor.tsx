import { useState } from 'react';

import AutoCompleteEditor from './AutoCompleteEditor';

interface AllowedValuesEditorProps {
    value?: any;
    onChange: (result: any, modified: boolean) => void;
    placeholder?: string;
    allowedValues?: Array<{ label: string; value: any }>;
}

function AllowedValuesEditor({ value, onChange, placeholder, allowedValues = [] }: AllowedValuesEditorProps) {
    const [items, setItems] = useState(allowedValues);

    const filterItems = (query: string) => {
        const filtered = allowedValues.filter((item: any) => item.label.toLowerCase().includes(query.toLowerCase()));
        setItems(filtered);
    };

    return <AutoCompleteEditor value={value} onChange={onChange} placeholder={placeholder} items={items} onFilter={filterItems} />;
}

export default AllowedValuesEditor;
