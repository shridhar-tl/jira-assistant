import { useCallback, useState } from 'react';

import { Button, Modal } from '@components';

import { getSettingsError } from './settings';
import SettingsForm from './SettingsForm';
import type { TimeInStatusSettings } from './types';

interface SettingsDialogProps {
    settings: TimeInStatusSettings;
    onSave: (settings: TimeInStatusSettings) => void;
    onHide: () => void;
}

export default function SettingsDialog({ settings: initialSettings, onSave, onHide }: SettingsDialogProps) {
    const [settings, setSettings] = useState(initialSettings);

    const handleChange = useCallback((changes: Partial<TimeInStatusSettings>) => {
        setSettings((prev) => ({ ...prev, ...changes }));
    }, []);

    const settingsError = getSettingsError(settings);

    const footer = (
        <div className="flex items-center justify-end gap-2">
            {settingsError && <span className="me-auto text-xs text-red-600 dark:text-red-400">{settingsError}</span>}
            <Button label="Cancel" layout="plain" onClick={onHide} />
            <Button label="Save" leftIcon={<i className="fa fa-save" />} disabled={!!settingsError} onClick={() => onSave(settings)} />
        </div>
    );

    return (
        <Modal isOpen={true} onClose={onHide} title="Time in Status Configuration" size="lg" footer={footer}>
            <SettingsForm settings={settings} onChange={handleChange} />
        </Modal>
    );
}
