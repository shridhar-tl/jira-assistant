import type { ReactNode } from 'react';

import { Alert, Button } from '@components';

interface ConfigPanelProps {
    saveError: string | null;
    onSubmit?: () => void;
    children: ReactNode;
}

export default function ConfigPanel({ saveError, onSubmit, children }: ConfigPanelProps) {
    return (
        <div role="region" aria-label="Widget settings" className="flex min-h-110 flex-col gap-4 bg-(--bg-primary) p-4 text-(--text-primary)">
            {saveError && <Alert type="error" variant="left-accent" size="sm" title="Unable to save" description={saveError} />}
            {children}
            {onSubmit && (
                <div className="flex justify-end">
                    <Button leftIcon={<i className="fa fa-save" />} onClick={onSubmit}>
                        Done
                    </Button>
                </div>
            )}
        </div>
    );
}
