import { useMemo, useState } from 'react';

import { Button, Dropdown, Modal, SelectButton, TextInput } from '@components';

import type { BoardData } from '../../../shared/board-loader';
import Field from '../../../shared/components/Field';
import { conflictLabels, getDependencies } from '../../../shared/dependencies';
import { createDependency, removeDependency } from '../../actions';
import { usePlannerStore } from '../../store';

interface DependencyDialogProps {
    issueKey: string;
    data: BoardData;
    onHide: () => void;
}

type Relation = 'blockedBy' | 'blocks';

const relationItems = [
    { label: 'Is blocked by', value: 'blockedBy' },
    { label: 'Blocks', value: 'blocks' },
];
const keyPattern = /^[A-Z][A-Z0-9_]+-\d+$/;

/** Adds or removes dependencies of an issue by writing Jira issue links (PI-4). */
export default function DependencyDialog({ issueKey, data, onHide }: DependencyDialogProps) {
    const linkTypes = usePlannerStore((s) => s.settings.dependencyLinkTypes);
    const [relation, setRelation] = useState<Relation>('blockedBy');
    const [otherKey, setOtherKey] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const sprintOrder = useMemo(() => new Map(data.sprints.map((s, i) => [s.id, i])), [data.sprints]);
    const existing = useMemo(
        () =>
            getDependencies({ issues: { [issueKey]: data.issues[issueKey] }, linkTypes, sprintOrder }).map((dep) => ({
                ...dep,
                conflict: getDependencies({ issues: data.issues, linkTypes, sprintOrder }).find((d) => d.linkId === dep.linkId)?.conflict || dep.conflict,
            })),
        [data.issues, issueKey, linkTypes, sprintOrder],
    );

    const options = useMemo(
        () =>
            Object.values(data.issues)
                .filter((i) => i.key !== issueKey && !i.isSubtask)
                .map((i) => ({ label: `${i.key} ${i.summary}`, value: i.key })),
        [data.issues, issueKey],
    );

    const normalizedKey = otherKey.trim().toUpperCase();
    const canAdd = keyPattern.test(normalizedKey) && normalizedKey !== issueKey && !isSaving;

    const add = async () => {
        setIsSaving(true);
        if (relation === 'blockedBy') {
            await createDependency(normalizedKey, issueKey);
        } else {
            await createDependency(issueKey, normalizedKey);
        }
        setIsSaving(false);
        setOtherKey('');
    };

    return (
        <Modal isOpen onClose={onHide} title={`Dependencies of ${issueKey}`} size="md" footer={<Button label="Close" onClick={onHide} />}>
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    {!existing.length && <span className="text-sm text-(--text-tertiary)">No dependencies yet.</span>}
                    {existing.map((dep) => {
                        const isBlocker = dep.blockerKey === issueKey;
                        const other = isBlocker ? dep.dependantKey : dep.blockerKey;
                        return (
                            <div key={dep.id} className="flex items-center gap-2 rounded border border-(--border-primary) px-2 py-1 text-sm">
                                <span className="text-(--text-secondary)">{isBlocker ? 'Blocks' : 'Is blocked by'}</span>
                                <span className="font-medium">{other}</span>
                                <span className="truncate text-xs text-(--text-tertiary)">{data.issues[other]?.summary}</span>
                                <span className="flex-1" />
                                {dep.conflict !== 'none' && (
                                    <i className="fa fa-exclamation-triangle text-red-500" title={conflictLabels[dep.conflict]} />
                                )}
                                {data.permissions.linkIssues && (
                                    <Button
                                        layout="plain"
                                        size="xs"
                                        variant="danger"
                                        leftIcon={<i className="fa fa-trash" />}
                                        ariaLabel="Remove dependency"
                                        confirmText="Remove this issue link from Jira?"
                                        onClick={() => removeDependency(dep.linkId, dep.typeName, dep.inwardKey, dep.outwardKey)}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {data.permissions.linkIssues && (
                    <div className="flex flex-col gap-2 border-t border-(--border-primary) pt-3">
                        <SelectButton items={relationItems} value={relation} onChange={(e) => setRelation(e.value as Relation)} />
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <Field label="Issue on this board">
                                <Dropdown options={options} value={options.some((o) => o.value === normalizedKey) ? normalizedKey : undefined} onChange={(e) => setOtherKey(e.value as string)} searchable />
                            </Field>
                            <Field label="Or issue key">
                                <TextInput value={otherKey} onChange={(e) => setOtherKey(e.value)} placeholder="ABC-123" />
                            </Field>
                        </div>
                        <div className="flex justify-end">
                            <Button label="Add dependency" leftIcon={<i className="fa fa-link" />} disabled={!canAdd} isLoading={isSaving} onClick={add} />
                        </div>
                        <span className="text-[11px] text-(--text-tertiary)">Link type: {linkTypes[0]?.name}. Change it in the planner settings.</span>
                    </div>
                )}
            </div>
        </Modal>
    );
}
