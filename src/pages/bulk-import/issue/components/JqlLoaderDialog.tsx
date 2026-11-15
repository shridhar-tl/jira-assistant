import { useCallback, useMemo, useState } from 'react';

import { Button, FieldLabel, Modal, Multiselect, TextArea } from '@components';

import type { JiraFieldDefinition } from '@types';

import { getAddableFields } from '../row-builder';

interface JqlLoaderDialogProps {
    isOpen: boolean;
    fieldDefinitions: JiraFieldDefinition[];
    onClose: () => void;
    onLoad: (jql: string, fieldIds: string[]) => Promise<boolean>;
}

function JqlLoaderDialog({ isOpen, fieldDefinitions, onClose, onLoad }: JqlLoaderDialogProps) {
    const [jql, setJql] = useState('');
    const [fieldIds, setFieldIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fieldOptions = useMemo(() => getAddableFields(fieldDefinitions, []), [fieldDefinitions]);

    const load = useCallback(async () => {
        setIsLoading(true);
        try {
            if (await onLoad(jql.trim(), fieldIds)) {
                onClose();
            }
        } finally {
            setIsLoading(false);
        }
    }, [jql, fieldIds, onLoad, onClose]);

    const footer = (
        <div className="flex justify-end gap-2">
            <Button variant="secondary" label="Cancel" onClick={onClose} disabled={isLoading} />
            <Button
                variant="primary"
                leftIcon={<i className={isLoading ? 'fa fa-spinner fa-spin' : 'fa fa-search'} />}
                label="Load issues"
                onClick={load}
                disabled={isLoading || !jql.trim()}
            />
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Load issues for bulk update" size="md" footer={footer}>
            <div className="flex flex-col gap-4 p-5">
                <p className="text-sm text-(--text-secondary)">
                    Load existing issues using JQL to update, clone or delete them together. Choose the fields you would like to change.
                    Current values from Jira are shown in grey and only the cells you fill are updated.
                </p>
                <FieldLabel label="JQL query" required>
                    <TextArea
                        value={jql}
                        rows={3}
                        autoFocus
                        placeholder="project = PROJ AND sprint in openSprints() AND assignee = currentUser()"
                        onChange={(e) => setJql(e.value)}
                    />
                </FieldLabel>
                <FieldLabel label="Fields to update" hint="Summary, Project, Issue Type and Parent columns are always included">
                    <Multiselect
                        options={fieldOptions}
                        value={fieldIds}
                        searchable
                        placeholder="Choose fields"
                        onChange={(e) => setFieldIds((e.value as string[]) || [])}
                    />
                </FieldLabel>
            </div>
        </Modal>
    );
}

export default JqlLoaderDialog;
