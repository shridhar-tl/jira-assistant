import { useState } from 'react';

import { Button, Modal, ProgressBar } from '@components';

import { applyDraft, discardDraft, removeDraftChange } from '../actions';
import { usePlannerStore } from '../store';

/** Pending changes of draft mode with apply / discard and the result of each applied change (WI-1). */
export default function DraftBar() {
    const draft = usePlannerStore((s) => s.draft);
    const [showDetails, setShowDetails] = useState(false);

    if (!draft.enabled || (!draft.changes.length && !draft.results.length && !draft.isApplying)) {
        return null;
    }

    const failed = draft.results.filter((r) => !r.ok);

    return (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-amber-300 bg-amber-50 px-3 py-1.5 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
            <i className="fa fa-pencil-square-o" />
            {draft.isApplying ? (
                <>
                    <span>Applying changes…</span>
                    <ProgressBar value={draft.progress} className="w-40" />
                </>
            ) : (
                <span>
                    <b>{draft.changes.length}</b> pending {draft.changes.length === 1 ? 'change' : 'changes'}
                    {failed.length > 0 && <span className="ms-2 text-red-700 dark:text-red-300">({failed.length} failed in the last apply)</span>}
                </span>
            )}
            <span className="flex-1" />
            <Button size="sm" layout="plain" label="Details" onClick={() => setShowDetails(true)} />
            <Button size="sm" layout="outlined" label="Discard" disabled={draft.isApplying || !draft.changes.length} confirmText="Discard all pending changes?" onClick={discardDraft} />
            <Button size="sm" label="Apply to Jira" leftIcon={<i className="fa fa-check" />} disabled={draft.isApplying || !draft.changes.length} isLoading={draft.isApplying} onClick={applyDraft} />

            {showDetails && (
                <Modal isOpen onClose={() => setShowDetails(false)} title="Draft changes" size="md" footer={<Button label="Close" onClick={() => setShowDetails(false)} />}>
                    <div className="flex flex-col gap-1 text-sm">
                        {draft.changes.map((change) => {
                            const result = draft.results.find((r) => r.id === change.id);
                            return (
                                <div key={change.id} className="flex items-center gap-2 rounded border border-(--border-primary) px-2 py-1">
                                    <span className="flex-1">{change.label}</span>
                                    {result && !result.ok && <span className="text-xs text-red-600 dark:text-red-400">{result.message}</span>}
                                    <Button size="xs" layout="plain" leftIcon={<i className="fa fa-times" />} ariaLabel="Remove from draft" disabled={draft.isApplying} onClick={() => removeDraftChange(change.id)} />
                                </div>
                            );
                        })}
                        {!draft.changes.length &&
                            draft.results.map((result) => (
                                <div key={result.id} className="flex items-center gap-2">
                                    <i className={result.ok ? 'fa fa-check text-emerald-600' : 'fa fa-times text-red-600'} />
                                    <span>{result.label}</span>
                                    {result.message && <span className="text-xs text-red-600">{result.message}</span>}
                                </div>
                            ))}
                    </div>
                </Modal>
            )}
        </div>
    );
}
