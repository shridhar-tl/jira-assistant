import { useState } from 'react';

import { DateTimePicker } from '@/controls';

import { Button, Dropdown, Modal, NumericInput } from '@components';

import { backlogColumnId, type BoardData } from '../../../shared/board-loader';
import Field from '../../../shared/components/Field';
import UserPicker from '../../../shared/components/UserPicker';
import type { PlannerUser } from '../../../shared/types';
import { findIssueColumn, moveIssues, updateIssue, type IssueEdit } from '../../actions';

interface IssueEditDialogProps {
    issueKey: string;
    data: BoardData;
    canEdit: boolean;
    canSchedule: boolean;
    onPlanSegments?: () => void;
    onHide: () => void;
}

export default function IssueEditDialog({ issueKey, data, canEdit, canSchedule, onPlanSegments, onHide }: IssueEditDialogProps) {
    const issue = data.issues[issueKey];
    const currentColumn = findIssueColumn(data, issueKey) || backlogColumnId;
    const hoursMode = data.estimateUnit === 'hours';
    const initialEstimate = hoursMode
        ? issue?.originalEstimate !== null && issue?.originalEstimate !== undefined
            ? issue.originalEstimate / 3600
            : undefined
        : (issue?.points ?? undefined);

    const [assignee, setAssignee] = useState<PlannerUser | null>(issue?.assignee || null);
    const [estimate, setEstimate] = useState<number | undefined>(initialEstimate);
    const [column, setColumn] = useState(currentColumn);
    const [startDate, setStartDate] = useState<Date | null>(issue?.startDate || null);
    const [dueDate, setDueDate] = useState<Date | null>(issue?.dueDate || null);
    const [isSaving, setIsSaving] = useState(false);

    if (!issue) {
        return null;
    }

    const columnOptions = [
        { label: 'Backlog', value: backlogColumnId },
        ...data.sprints.filter((s) => s.state !== 'closed').map((s) => ({ label: s.name, value: String(s.id) })),
    ];

    const save = async () => {
        setIsSaving(true);
        const edit: IssueEdit = {};
        if ((assignee?.id || null) !== (issue.assignee?.id || null)) {
            edit.assignee = assignee;
        }
        if (estimate !== initialEstimate) {
            edit.estimate = estimate ?? null;
        }
        if ((startDate?.getTime() || 0) !== (issue.startDate?.getTime() || 0) && data.fieldIds.startDate) {
            edit.startDate = startDate;
        }
        if ((dueDate?.getTime() || 0) !== (issue.dueDate?.getTime() || 0)) {
            edit.dueDate = dueDate;
        }
        if (Object.keys(edit).length) {
            await updateIssue(issueKey, edit);
        }
        if (column !== currentColumn) {
            await moveIssues([issueKey], column, (data.columns[column] || []).length);
        }
        setIsSaving(false);
        onHide();
    };

    const footer = (
        <div className="flex items-center justify-end gap-2">
            <a href={issue.url} target="_blank" rel="noreferrer" className="me-auto cursor-pointer text-sm text-(--primary-color) hover:underline">
                Open in Jira <i className="fa fa-external-link" />
            </a>
            {onPlanSegments && (
                <Button
                    label="Plan segments"
                    layout="plain"
                    leftIcon={<i className="fa fa-calendar-plus" />}
                    title="Split the work into planned segments with their own dates and people"
                    onClick={() => {
                        onHide();
                        onPlanSegments();
                    }}
                />
            )}
            <Button label="Cancel" layout="plain" onClick={onHide} />
            <Button label="Save" isLoading={isSaving} disabled={isSaving || (!canEdit && !canSchedule)} onClick={save} />
        </div>
    );

    return (
        <Modal isOpen onClose={onHide} title={`${issue.key} · ${issue.summary}`} size="md" footer={footer}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Assignee" className="sm:col-span-2">
                    <UserPicker value={assignee} onChange={setAssignee} suggestions={data.members} allowUnassigned />
                </Field>
                <Field label={hoursMode ? 'Original estimate (hours)' : data.config.estimationFieldName || 'Story points'}>
                    <NumericInput value={estimate} onChange={(e) => setEstimate(e.value)} min={0} maxDecimals={2} readonly={!canEdit} />
                </Field>
                <Field label="Sprint">
                    <Dropdown options={columnOptions} value={column} onChange={(e) => setColumn(e.value as string)} readOnly={!canSchedule} />
                </Field>
                <Field label="Start date" hint={data.fieldIds.startDate ? undefined : 'No start date field is configured in the planner settings.'}>
                    <DateTimePicker value={startDate || undefined} onChange={setStartDate} onClear={() => setStartDate(null)} disabled={!data.fieldIds.startDate || !canEdit} />
                </Field>
                <Field label="Due date">
                    <DateTimePicker value={dueDate || undefined} onChange={setDueDate} onClear={() => setDueDate(null)} disabled={!canEdit} />
                </Field>
            </div>
        </Modal>
    );
}
