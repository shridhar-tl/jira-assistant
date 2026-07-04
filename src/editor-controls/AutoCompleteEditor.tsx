import { useState } from 'react';

import type { ComponentEvent, ListItem } from 'fluxo-ui';

import { Image } from '@/controls';

import { Autocomplete } from '@components';

interface AutoCompleteEditorProps {
    value?: any;
    onChange: (value: any, modified: boolean) => void;
    placeholder?: string;
    className?: string;
    items?: ListItem[];
    onFilter?: (query: string) => void | Promise<void>;
}

function AutoCompleteEditor({ value, onChange, placeholder, className, items = [], onFilter }: AutoCompleteEditorProps) {
    const [inputValue, setInputValue] = useState(typeof value === 'string' ? value : value?.value || '');

    const getItem = (val: string) => ({ value: val });

    const handleChange = (e: ComponentEvent<string>) => {
        setInputValue(e.value);
    };

    const handleSelect = (e: ComponentEvent<any>) => {
        const item = items.find((i) => i.value === e.value);
        if (item) {
            onChange({ value: item.value, displayText: item.label }, true);
        } else {
            onChange(getItem(e.value), true);
        }
    };

    const renderItem = (item: ListItem) => (
        <span className="text-xs mt-2.5 mr-2.5">
            {!!(item as any).iconUrl && <Image src={(item as any).iconUrl} />} {item.label}
        </span>
    );

    return (
        <Autocomplete
            items={items}
            value={inputValue}
            className={className}
            placeholder={placeholder}
            renderItem={(item, _index, _isSelected, _isHighlighted) => renderItem(item)}
            onFilter={onFilter}
            onChange={handleChange}
            onSelect={handleSelect}
        />
    );
}

export default AutoCompleteEditor;
