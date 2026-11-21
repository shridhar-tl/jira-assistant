import type { ReactNode } from 'react';

import { Button, Modal, TextInput } from '@components';

interface ConfigureDialogShellProps {
    title: string;
    name: string;
    onNameChange: (name: string) => void;
    canApply: boolean;
    applyLabel: string;
    onApply: () => void;
    onCancel: () => void;
    error?: string | null;
    children: ReactNode;
}

const nameInputId = 'ja-rb-ds-name';

export default function ConfigureDialogShell({
    title,
    name,
    onNameChange,
    canApply,
    applyLabel,
    onApply,
    onCancel,
    error,
    children,
}: ConfigureDialogShellProps) {
    const footer = (
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
            {error && (
                <span className="mr-auto text-xs text-(--color-error)" role="alert">
                    {error}
                </span>
            )}
            <Button layout="outlined" leftIcon={<i className="fa fa-times" />} onClick={onCancel} label="Cancel" />
            <Button variant="primary" leftIcon={<i className="fa fa-check" />} onClick={onApply} disabled={!canApply} label={applyLabel} />
        </div>
    );

    return (
        <Modal isOpen onClose={onCancel} title={title} size="xl" footer={footer} closeOnBackdrop={false}>
            <div className="flex flex-col gap-5 p-1">
                <div className="flex flex-col gap-1.5">
                    <label htmlFor={nameInputId} className="text-sm font-semibold text-(--text-primary)">
                        Datasource name
                    </label>
                    <TextInput id={nameInputId} value={name} onChange={(e) => onNameChange(e.value)} placeholder="e.g. OpenBugs" />
                    <span className="text-xs text-(--text-secondary)">
                        Used in expressions as Datasources.{name || 'Name'}. Letters, digits and underscores only.
                    </span>
                </div>
                {children}
            </div>
        </Modal>
    );
}
