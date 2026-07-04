import { useMemo } from 'react';

import { DateTimePicker } from '../controls';
import { inject } from '../services';

interface DateEditorProps {
    value?: Date;
    showTime?: boolean;
    placeholder?: string;
    onChange: (result: any, modified: boolean) => void;
}

function DateEditor({ value, showTime, placeholder = 'Choose a date', onChange }: DateEditorProps) {
    const $userUtils = inject('UserUtilsService') as any;
    const format = useMemo(() => (showTime ? $userUtils.formatDateTime : $userUtils.formatDate), [showTime, $userUtils]);

    const handleChange = (val: Date | undefined, modified: boolean) => {
        const valueObj = val ? { value: val, displayText: format(val) } : { clearValue: true };
        onChange(valueObj, modified);
    };

    const handleValueChange = (val: Date | undefined) => {
        handleChange(val, true);
    };

    return (
        <DateTimePicker
            className="ja-date-editor"
            value={value}
            showTime={showTime}
            placeholder={placeholder}
            onChange={handleValueChange}
        />
    );
}

export default DateEditor;
