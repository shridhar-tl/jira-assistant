import { useRef, useState } from 'react';

import { ColorPicker } from '@components';

interface ProjectColorPickerProps {
    projectKey: string;
    projectName: string;
    color?: string;
    defaultColor: string;
    onChange: (projectKey: string, color?: string) => void;
}

export default function ProjectColorPicker({ projectKey, projectName, color, defaultColor, onChange }: ProjectColorPickerProps) {
    const [draft, setDraft] = useState<string>();
    const draftRef = useRef<string>(undefined);

    const updateDraft = (value?: string) => {
        draftRef.current = value;
        setDraft(value);
    };

    const commitDraft = (open: boolean) => {
        if (open || !draftRef.current) return;
        if (draftRef.current !== color) {
            onChange(projectKey, draftRef.current);
        }
        updateDraft(undefined);
    };

    const clearColor = () => {
        updateDraft(undefined);
        onChange(projectKey);
    };

    return (
        <ColorPicker
            variant="swatch"
            size="xs"
            showAlpha={false}
            value={draft || color || defaultColor}
            ariaLabel={`Worklog calendar color for ${projectName}`}
            clearLabel="Use default worklog color"
            onClear={color || draft ? clearColor : undefined}
            onChange={(value) => updateDraft(value)}
            onOpenChange={commitDraft}
        />
    );
}
