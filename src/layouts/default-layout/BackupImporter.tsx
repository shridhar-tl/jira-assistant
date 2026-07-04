import { useRef } from 'react';
import type { ReactNode } from 'react';

import { parseCustomJSON } from '@/common/storage-helpers';

import { inject } from '@services';

const msgFileCorrupted = 'Selected file is invalid or is corrupted. Unable to load the file!';

interface BackupImporterProps {
    cleanImport?: boolean;
    onImport?: () => void;
    children: (chooseFile: () => void) => ReactNode;
}

export default function BackupImporter({ cleanImport, onImport, children }: BackupImporterProps) {
    const fileSelectorRef = useRef<HTMLInputElement>(null);
    const { $backup, $message } = inject('BackupService', 'MessageService');

    const chooseFileForImport = () => {
        fileSelectorRef.current?.click();
    };

    const fileSelected = async () => {
        const selector = fileSelectorRef.current;
        if (!selector) return;

        const file = selector.files?.[0];

        if (file) {
            if (!file.name.endsWith('.jab')) {
                $message.warning('Unknown file selected to import. Select a valid Jira Assist Backup (*.jab) file');
                selector.value = '';
                return;
            }

            const reader = new FileReader();
            reader.readAsText(file, 'UTF-8');

            reader.onload = async (evt) => {
                const json = evt.target?.result as string;
                let parsed = false;

                try {
                    const data = parseCustomJSON(json);
                    parsed = true;
                    const logs = await $backup.importBackup(data?.value, undefined, cleanImport);
                    console.log('Import logs:', logs);

                    if (onImport) {
                        onImport();
                    }

                    $message.success('Settings imported successfully. Check console logs for more details.');
                } catch (err: any) {
                    console.error('Backup import failed', err);
                    if (parsed) {
                        $message.error(err.message);
                    } else {
                        $message.error(msgFileCorrupted);
                    }
                }
            };

            reader.onerror = () => {
                $message.error(msgFileCorrupted);
            };
        } else {
            $message.warning('Import operation cancelled');
        }

        selector.value = '';
    };

    return (
        <>
            {children(chooseFileForImport)}
            <input ref={fileSelectorRef} type="file" className="hidden" accept=".jab" onChange={fileSelected} />
        </>
    );
}
