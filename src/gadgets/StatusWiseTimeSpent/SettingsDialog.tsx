import { useState } from 'react';

import JQLEditor from '@/jira-controls/JQLEditor';

import { Button, Modal } from '@components';

import type { StatusWiseTimeSpentSettings } from './types';

interface SettingsDialogProps {
    settings: StatusWiseTimeSpentSettings;
    onSave: (settings: StatusWiseTimeSpentSettings) => void;
    onHide: () => void;
}

export function SettingsDialog({ settings, onSave, onHide }: SettingsDialogProps) {
    const [jql, setJql] = useState(settings.jql || '');

    const handleSave = () => {
        onSave({
            ...settings,
            jql,
        });
        onHide();
    };

    return (
        <Modal title="Gadget Configuration" isOpen={true} onClose={onHide} size="lg">
            <div className="p-4 space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-(--text-primary) mb-2">JQL Query</label>
                    <JQLEditor jql={jql} onChange={(value) => setJql(value)} />
                    <p className="mt-2 text-xs text-(--text-secondary)">
                        This JQL will be used to fetch tickets for status-wise time spent analysis. The gadget will calculate how much time
                        each ticket has spent in different statuses based on the changelog.
                    </p>
                </div>

                <div className="bg-(--bg-secondary) p-3 rounded border border-(--border-color)">
                    <h4 className="text-sm font-semibold text-(--text-primary) mb-2">Examples:</h4>
                    <ul className="text-xs text-(--text-secondary) space-y-1">
                        <li>
                            • <code className="bg-(--bg-primary) px-1 py-0.5 rounded">project = MYPROJECT</code>
                        </li>
                        <li>
                            • <code className="bg-(--bg-primary) px-1 py-0.5 rounded">assignee = currentUser() AND created &gt;= -30d</code>
                        </li>
                        <li>
                            • <code className="bg-(--bg-primary) px-1 py-0.5 rounded">sprint in openSprints()</code>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="flex gap-2 justify-end p-4 border-t border-(--border-color)">
                <Button label="Cancel" onClick={onHide} layout="plain" />
                <Button label="Save" leftIcon={<i className="fa fa-save" />} onClick={handleSave} />
            </div>
        </Modal>
    );
}
