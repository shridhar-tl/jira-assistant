import { useMemo, useState } from 'react';

import { inject } from '@services';

import { Button, SelectButton, TextInput } from '@components';

import DependencyTable from '../../shared/components/DependencyTable';
import Field from '../../shared/components/Field';
import type { Dependency } from '../../shared/dependencies';
import { deleteIssueLink, getJiraErrorMessage } from '../../shared/jira-api';
import { addDependency, loadExternalIssues, reloadPlanData, type ExternalIssue } from '../pi-actions';
import type { PiData } from '../pi-loader';
import { applyExternalPlacements, getPlanSprintRanges, type ProgramModel } from '../pi-model';
import type { PiDocument } from '../pi-types';
import type { TermSet } from '../terminology';

interface PiDependenciesViewProps {
    doc: PiDocument;
    data: PiData;
    model: ProgramModel;
    terms: TermSet;
    canEdit: boolean;
}

type Relation = 'blockedBy' | 'blocks';

const relationItems = [
    { label: 'Is blocked by', value: 'blockedBy' },
    { label: 'Blocks', value: 'blocks' },
];
const keyPattern = /^[A-Z][A-Z0-9_]+-\d+$/;

function normalizeKey(value: string): string {
    return value.trim().toUpperCase();
}

export default function PiDependenciesView({ doc, data, model, terms, canEdit }: PiDependenciesViewProps) {
    const [external, setExternal] = useState<Record<string, ExternalIssue>>({});
    const [isChecking, setIsChecking] = useState(false);
    const [issueKey, setIssueKey] = useState('');
    const [otherKey, setOtherKey] = useState('');
    const [relation, setRelation] = useState<Relation>('blockedBy');
    const [isSaving, setIsSaving] = useState(false);

    const outsideKeys = useMemo(
        () =>
            [
                ...new Set(
                    model.dependencies.flatMap((d) => [d.blockerKey, d.dependantKey]).filter((key) => !data.stories[key] && !data.features[key]),
                ),
            ],
        [model.dependencies, data.stories, data.features],
    );

    const dependencies = useMemo(
        () => (Object.keys(external).length ? applyExternalPlacements(model.dependencies, data, getPlanSprintRanges(doc, data), external) : model.dependencies),
        [model.dependencies, data, doc, external],
    );

    const sprintName = (sprintId: number | null) =>
        sprintId ? Object.values(data.teams).flatMap((t) => t.sprints).find((s) => s.id === sprintId)?.name || 'Sprint' : 'Not in a sprint';

    const locationOf = (key: string) => {
        const issue = data.stories[key] || data.features[key];
        if (issue) {
            return sprintName(issue.currentSprintId);
        }
        const info = external[key];
        if (!info) {
            return `Outside this ${terms.plan.toLowerCase()}`;
        }
        const sprint = info.sprint?.name || 'Not in a sprint';
        return info.planName ? `${sprint} · ${info.planName}` : `${sprint} · no ${terms.plan.toLowerCase()}`;
    };

    const teamOf = (key: string) => {
        const team = model.storyTeam.get(key);
        return team ? doc.teams.find((t) => t.boardId === team)?.name || '' : '';
    };

    const checkOtherPlans = async () => {
        setIsChecking(true);
        try {
            setExternal(await loadExternalIssues(outsideKeys));
        } catch (err) {
            const { $message } = inject('MessageService');
            $message.error(getJiraErrorMessage(err), 'Unable to read the issues outside the plan');
        } finally {
            setIsChecking(false);
        }
    };

    const removeDependency = async (dep: Dependency) => {
        try {
            await deleteIssueLink(dep.linkId);
            await reloadPlanData(false);
        } catch (err) {
            const { $message } = inject('MessageService');
            $message.error(getJiraErrorMessage(err), 'Unable to remove the dependency');
        }
    };

    const first = normalizeKey(issueKey);
    const second = normalizeKey(otherKey);
    const canAdd = keyPattern.test(first) && keyPattern.test(second) && first !== second && !isSaving;

    const add = async () => {
        setIsSaving(true);
        const ok = relation === 'blockedBy' ? await addDependency(second, first) : await addDependency(first, second);
        setIsSaving(false);
        if (ok) {
            setIssueKey('');
            setOtherKey('');
        }
    };

    return (
        <div className="flex flex-col gap-4 p-3">
            <div className="flex flex-wrap items-end gap-3 rounded-lg border border-(--border-primary) p-3">
                {canEdit && (
                    <>
                        <Field label="Issue" className="w-36">
                            <TextInput value={issueKey} onChange={(e) => setIssueKey(e.value)} placeholder="ABC-123" />
                        </Field>
                        <SelectButton items={relationItems} value={relation} onChange={(e) => setRelation(e.value as Relation)} />
                        <Field label="Other issue (any program)" className="w-44">
                            <TextInput value={otherKey} onChange={(e) => setOtherKey(e.value)} placeholder="XYZ-456" />
                        </Field>
                        <Button label="Add dependency" leftIcon={<i className="fa fa-link" />} disabled={!canAdd} isLoading={isSaving} onClick={add} />
                    </>
                )}
                <span className="flex-1" />
                <Button
                    layout="outlined"
                    label={`Check other ${terms.plans.toLowerCase()} (${outsideKeys.length})`}
                    leftIcon={<i className="fa fa-sitemap" />}
                    title={`Find the sprint and the ${terms.plan.toLowerCase()} of the issues outside this ${terms.plan.toLowerCase()} and compare their dates`}
                    disabled={!outsideKeys.length}
                    isLoading={isChecking}
                    onClick={checkOtherPlans}
                />
            </div>
            <DependencyTable dependencies={dependencies} issues={{ ...data.stories, ...data.features }} locationOf={locationOf} teamOf={teamOf} summaryOf={(key) => external[key]?.summary} canRemove={canEdit} onRemove={removeDependency} />
        </div>
    );
}
