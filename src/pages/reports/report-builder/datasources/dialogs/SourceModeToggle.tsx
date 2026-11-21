import { SelectButton } from '@components';

import type { SourceMode } from '../sprint-resolution';

interface SourceModeToggleProps {
    value: SourceMode;
    onChange: (mode: SourceMode) => void;
    fixedLabel: string;
    expressionLabel: string;
    ariaLabel: string;
}

export default function SourceModeToggle({ value, onChange, fixedLabel, expressionLabel, ariaLabel }: SourceModeToggleProps) {
    const items = [
        { value: 'fixed', label: fixedLabel },
        { value: 'expression', label: expressionLabel },
    ];
    return (
        <SelectButton
            items={items}
            value={value}
            onChange={(e) => onChange(e.value as SourceMode)}
            variant="segmented"
            fullWidth
            required
            ariaLabel={ariaLabel}
        />
    );
}
