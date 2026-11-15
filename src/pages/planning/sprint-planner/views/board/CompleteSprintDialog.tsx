import { useMemo, useState } from 'react';

import { Button, Dropdown, Modal, TextInput } from '@components';

import type { BoardData } from '../../../shared/board-loader';
import Field from '../../../shared/components/Field';
import { getNextSprintName } from '../../../shared/forecast';
import type { PlannerSprint } from '../../../shared/types';
import { completeSprint, getOpenIssueKeys, type CompleteSprintTarget } from '../../actions';

interface CompleteSprintDialogProps {
    sprint: PlannerSprint;
    data: BoardData;
    onHide: () => void;
}

const backlogValue = 'backlog';
const newSprintValue = 'new';

export default function CompleteSprintDialog({ sprint, data, onHide }: CompleteSprintDialogProps) {
    const openKeys = useMemo(() => getOpenIssueKeys(data, sprint.id), [data, sprint.id]);
    const futureSprints = data.sprints.filter((s) => s.state === 'future');
    const lastSprint = data.sprints[data.sprints.length - 1];
    const [target, setTarget] = useState<string>(futureSprints[0] ? String(futureSprints[0].id) : backlogValue);
    const [newName, setNewName] = useState(getNextSprintName(lastSprint?.name, 1, data.board.name));
    const [isSaving, setIsSaving] = useState(false);
    const doneCount = (data.columns[String(sprint.id)] || []).length - openKeys.length;

    const options = [
        ...futureSprints.map((s) => ({ label: s.name, value: String(s.id) })),
        { label: 'New sprint', value: newSprintValue },
        { label: 'Backlog', value: backlogValue },
    ];

    const save = async () => {
        const selected: CompleteSprintTarget =
            target === backlogValue ? { kind: 'backlog' } : target === newSprintValue ? { kind: 'new', name: newName.trim() } : { kind: 'sprint', sprintId: Number(target) };
        setIsSaving(true);
        const ok = await completeSprint(sprint.id, selected);
        setIsSaving(false);
        if (ok) {
            onHide();
        }
    };

    const footer = (
        <div className="flex items-center justify-end gap-2">
            <Button label="Cancel" layout="plain" onClick={onHide} />
            <Button label="Complete sprint" isLoading={isSaving} disabled={isSaving || (target === newSprintValue && !newName.trim())} onClick={save} />
        </div>
    );

    return (
        <Modal isOpen onClose={onHide} title={`Complete ${sprint.name}`} size="md" footer={footer}>
            <div className="flex flex-col gap-3 text-sm">
                <p>
                    This sprint contains <b>{doneCount}</b> completed issues and <b>{openKeys.length}</b> open issues.
                </p>
                {openKeys.length > 0 && (
                    <>
                        <Field label="Move open issues to">
                            <Dropdown options={options} value={target} onChange={(e) => setTarget(e.value as string)} />
                        </Field>
                        {target === newSprintValue && (
                            <Field label="New sprint name">
                                <TextInput value={newName} onChange={(e) => setNewName(e.value)} maxLength={30} />
                            </Field>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
}
