import { useEffect, useMemo, useState } from 'react';

import { GadgetAlert } from '@/gadgets/shared';
import type { JiraCreateIssueType } from '@/types';

import { inject } from '@services';

import { Button, Dropdown, Modal, NumericInput, TextInput } from '@components';


import { backlogColumnId, type BoardData } from '../../../shared/board-loader';
import Field from '../../../shared/components/Field';
import UserPicker from '../../../shared/components/UserPicker';
import type { PlannerUser } from '../../../shared/types';
import { createIssueInColumn, getFullCreateUrl } from '../../actions';

interface CreateIssueDialogProps {
    columnId: string;
    data: BoardData;
    onHide: () => void;
}

const noParentValue = '';

function openUrl(url: string) {
    const { $jaBrowserExtn } = inject('AppBrowserService');
    $jaBrowserExtn.openTab(url);
}

/** Inline create of an issue directly into a sprint or the backlog (SP-19). */
export default function CreateIssueDialog({ columnId, data, onHide }: CreateIssueDialogProps) {
    const projects = useMemo(() => {
        const map = new Map<string, string>();
        if (data.config.projectKey) {
            map.set(data.config.projectKey, data.config.projectId || '');
        }
        Object.values(data.issues).forEach((i) => !map.has(i.projectKey) && map.set(i.projectKey, i.projectId));
        return [...map.entries()].map(([key, id]) => ({ key, id }));
    }, [data]);

    const [projectKey, setProjectKey] = useState(projects[0]?.key || '');
    const [issueTypes, setIssueTypes] = useState<JiraCreateIssueType[]>([]);
    const [issueTypeId, setIssueTypeId] = useState('');
    const [summary, setSummary] = useState('');
    const [estimate, setEstimate] = useState<number | undefined>();
    const [assignee, setAssignee] = useState<PlannerUser | null>(null);
    const [parentKey, setParentKey] = useState(noParentValue);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<{ message: string; needsFullForm: boolean } | null>(null);

    useEffect(() => {
        if (!projectKey) {
            return;
        }
        let cancelled = false;
        const { $jira } = inject('JiraService');
        $jira
            .getCreateMetaIssueTypes(projectKey)
            .then((types) => {
                if (cancelled) {
                    return;
                }
                const standard = (types || []).filter((t) => !t.subtask && (t.hierarchyLevel ?? 0) === 0);
                setIssueTypes(standard);
                setIssueTypeId((current) => (standard.some((t) => t.id === current) ? current : standard.find((t) => /story/i.test(t.name))?.id || standard[0]?.id || ''));
            })
            .catch((err) => console.error('Unable to load issue types', err));
        return () => {
            cancelled = true;
        };
    }, [projectKey]);

    const parents = useMemo(
        () => [
            { label: 'No parent', value: noParentValue },
            ...Object.values(data.parents)
                .filter((p) => p.statusCategory !== 'done')
                .map((p) => ({ label: `${p.key} ${p.summary}`, value: p.key })),
        ],
        [data.parents],
    );

    const projectId = projects.find((p) => p.key === projectKey)?.id || '';
    const target = columnId === backlogColumnId ? 'Backlog' : data.sprints.find((s) => String(s.id) === columnId)?.name || 'sprint';

    const save = async () => {
        setIsSaving(true);
        setError(null);
        const result = await createIssueInColumn(columnId, {
            projectKey,
            issueTypeId,
            summary: summary.trim(),
            estimate: estimate ?? null,
            assignee,
            parentKey: parentKey || null,
        });
        setIsSaving(false);
        if (result.ok) {
            onHide();
        } else {
            setError({ message: result.message || 'Unable to create the issue', needsFullForm: result.needsFullForm });
        }
    };

    const footer = (
        <div className="flex items-center justify-end gap-2">
            <Button
                label="Full create form"
                layout="plain"
                className="me-auto"
                leftIcon={<i className="fa fa-external-link" />}
                disabled={!projectId || !issueTypeId}
                onClick={() => openUrl(getFullCreateUrl(projectId, issueTypeId, summary))}
            />
            <Button label="Cancel" layout="plain" onClick={onHide} />
            <Button label="Create" isLoading={isSaving} disabled={isSaving || !summary.trim() || !issueTypeId || !projectKey} onClick={save} />
        </div>
    );

    return (
        <Modal isOpen onClose={onHide} title={`Create issue in ${target}`} size="md" footer={footer}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {error && (
                    <GadgetAlert
                        className="sm:col-span-2"
                        action={
                            error.needsFullForm ? (
                                <Button label="Open full form" size="sm" layout="outlined" onClick={() => openUrl(getFullCreateUrl(projectId, issueTypeId, summary))} />
                            ) : undefined
                        }
                    >
                        {error.needsFullForm ? `This project needs more fields to create the issue. ${error.message}` : error.message}
                    </GadgetAlert>
                )}
                <Field label="Summary" className="sm:col-span-2">
                    <TextInput value={summary} onChange={(e) => setSummary(e.value)} autoFocus maxLength={255} />
                </Field>
                {projects.length > 1 && (
                    <Field label="Project">
                        <Dropdown options={projects.map((p) => ({ label: p.key, value: p.key }))} value={projectKey} onChange={(e) => setProjectKey(e.value as string)} />
                    </Field>
                )}
                <Field label="Issue type">
                    <Dropdown options={issueTypes.map((t) => ({ label: t.name, value: t.id }))} value={issueTypeId} onChange={(e) => setIssueTypeId(e.value as string)} />
                </Field>
                <Field label={data.estimateUnit === 'hours' ? 'Estimate (hours)' : 'Story points'}>
                    <NumericInput value={estimate} onChange={(e) => setEstimate(e.value)} min={0} maxDecimals={2} />
                </Field>
                <Field label="Assignee">
                    <UserPicker value={assignee} onChange={setAssignee} suggestions={data.members} allowUnassigned />
                </Field>
                <Field label="Parent" className="sm:col-span-2">
                    <Dropdown options={parents} value={parentKey} onChange={(e) => setParentKey(e.value as string)} searchable />
                </Field>
            </div>
        </Modal>
    );
}
