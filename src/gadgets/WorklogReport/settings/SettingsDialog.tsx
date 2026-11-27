import { useCallback, useState } from 'react';

import { Modal } from '@components';

import ReportSettings, { type ReportSettingsResult } from './ReportSettings';

interface SettingsDialogProps {
    onHide: (result?: ReportSettingsResult) => void;
}

function SettingsDialog({ onHide }: SettingsDialogProps) {
    const [isOpen, setIsOpen] = useState(true);

    const handleDone = useCallback(
        (result: ReportSettingsResult) => {
            setIsOpen(false);
            onHide(result);
        },
        [onHide],
    );

    const handleClose = useCallback(() => {
        setIsOpen(false);
        onHide();
    }, [onHide]);

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Report Configurations" size="xl">
            <div className="-m-6">
                <ReportSettings onDone={handleDone} />
            </div>
        </Modal>
    );
}

export default SettingsDialog;
