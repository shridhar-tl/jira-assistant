import { useEffect, useState } from 'react';

import { inject } from '@services';

import { Button, Dropdown, InputSwitch, Modal, Multiselect, SelectButton, TextInput } from '@components';

import Field from '../../shared/components/Field';
import UserAvatar from '../../shared/components/UserAvatar';
import UserPicker from '../../shared/components/UserPicker';
import { getIssueLinkTypes, getNumberFieldOptions, getSelectFieldOptions } from '../../shared/jira-api';
import type { IssueLinkType, PlannerUser, Terminology } from '../../shared/types';
import { saveSettings } from '../pi-actions';
import type { CadenceMode, PiProgramSettings } from '../pi-types';

interface PiSettingsDialogProps {
    settings: PiProgramSettings;
    onHide: () => void;
}

const terminologyItems = [
    { label: 'Neutral', value: 'neutral' },
    { label: 'SAFe', value: 'safe' },
];
const cadenceItems = [
    { label: 'Common iterations', value: 'aligned' },
    { label: 'Each team\'s sprints', value: 'teamSprints' },
];
const storageItems = [
    { label: 'Jira Assistant', value: 'ja' },
    { label: 'Jira issues', value: 'jira' },
];
const noField = '';

interface JiraIssueType {
    id: string;
    name: string;
    subtask?: boolean;
    scope?: { project?: { id: string } };
}

interface JiraProject {
    id: string;
    name: string;
}

interface IssueTypeOption {
    label: string;
    value: string;
    name: string;
}

function getIssueTypeOptions(types: JiraIssueType[], projects: JiraProject[]): IssueTypeOption[] {
    const projectNames = new Map(projects.map((p) => [p.id, p.name]));
    return types
        .filter((t) => !t.subtask)
        .map((t) => {
            const projectId = t.scope?.project?.id;
            return { label: projectId ? `${t.name} (${projectNames.get(projectId) || projectId})` : t.name, value: t.id, name: t.name };
        })
        .sort((a, b) => a.label.localeCompare(b.label));
}

export default function PiSettingsDialog({ settings: initial, onHide }: PiSettingsDialogProps) {
    const [settings, setSettings] = useState<PiProgramSettings>(initial);
    const [issueTypes, setIssueTypes] = useState<IssueTypeOption[]>([]);
    const [fields, setFields] = useState<{ label: string; value: string }[]>([]);
    const [selectFields, setSelectFields] = useState<{ label: string; value: string }[]>([]);
    const [linkTypes, setLinkTypes] = useState<IssueLinkType[]>([]);
    const [editors, setEditors] = useState<PlannerUser[]>(initial.editors.accountIds.map((id) => ({ id, displayName: initial.editors.names?.[id] || id })));
    const [groupText, setGroupText] = useState(initial.editors.groupIds.join(', '));
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const { $jira } = inject('JiraService');
        Promise.all([$jira.getIssueTypes() as Promise<JiraIssueType[]>, ($jira.getProjects() as Promise<JiraProject[]>).catch(() => [] as JiraProject[])])
            .then(([types, projects]) => setIssueTypes(getIssueTypeOptions(types, projects)))
            .catch(console.error);
        getNumberFieldOptions().then(setFields).catch(console.error);
        getSelectFieldOptions().then(setSelectFields).catch(console.error);
        getIssueLinkTypes().then(setLinkTypes).catch(console.error);
    }, []);

    const save = async () => {
        setIsSaving(true);
        const ok = await saveSettings({
            ...settings,
            editors: {
                ...settings.editors,
                accountIds: editors.map((e) => e.id),
                names: Object.fromEntries(editors.map((e) => [e.id, e.displayName])),
                groupIds: groupText
                    .split(',')
                    .map((g) => g.trim())
                    .filter(Boolean),
            },
        });
        setIsSaving(false);
        if (ok) {
            onHide();
        }
    };

    const footer = (
        <div className="flex justify-end gap-2">
            <Button label="Cancel" layout="plain" onClick={onHide} />
            <Button label="Save" isLoading={isSaving} disabled={isSaving} onClick={save} />
        </div>
    );

    const fieldOptions = [{ label: 'Not stored', value: noField }, ...fields];
    const featureTypeOptions = [...new Set(issueTypes.map((t) => t.name))].sort().map((name) => ({ label: name, value: name }));
    const linkType = settings.dependencyLinkTypes[0];
    const linkTypeOptions = (linkTypes.length ? linkTypes : [{ id: '', name: linkType.name, inward: '', outward: '' }]).map((t) => ({
        value: t.name,
        label: t.outward ? `${t.name} (${t.outward} / ${t.inward})` : t.name,
    }));
    const setLinkType = (name: string, outwardBlocks: boolean) => setSettings({ ...settings, dependencyLinkTypes: [{ name, outwardBlocks }] });

    return (
        <Modal isOpen onClose={onHide} title="Program settings" size="lg" footer={footer}>
            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Terminology" group>
                        <SelectButton items={terminologyItems} value={settings.terminology} onChange={(e) => setSettings({ ...settings, terminology: e.value as Terminology })} />
                    </Field>
                    <Field group label="Board columns" hint="Teams with different sprint lengths can be aligned to common iterations by date.">
                        <SelectButton items={cadenceItems} value={settings.cadence} onChange={(e) => setSettings({ ...settings, cadence: e.value as CadenceMode })} />
                    </Field>
                    <InputSwitch label="Last iteration is an innovation and planning iteration by default" checked={settings.ipSprint} onChange={(e) => setSettings({ ...settings, ipSprint: e.value })} />
                </div>

                <section className="flex flex-col gap-3 border-t border-(--border-primary) pt-3">
                    <h3 className="text-sm font-semibold">Features and dependencies</h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Field label="Issue types planned as features" hint="Their child stories are planned in the team sprints. Defaults to Epic.">
                            <Multiselect options={featureTypeOptions} value={settings.featureIssueTypes} onChange={(e) => setSettings({ ...settings, featureIssueTypes: e.value as string[] })} searchable />
                        </Field>
                        <Field label="Issue link type used for dependencies">
                            <Dropdown options={linkTypeOptions} value={linkType.name} onChange={(e) => setLinkType(e.value as string, linkType.outwardBlocks)} searchable />
                        </Field>
                    </div>
                    <InputSwitch
                        label={`"${linkTypes.find((t) => t.name === linkType.name)?.outward || 'outward'}" means the issue blocks the other`}
                        checked={linkType.outwardBlocks}
                        onChange={(e) => setLinkType(linkType.name, e.value)}
                    />
                </section>

                <section className="flex flex-col gap-3 border-t border-(--border-primary) pt-3">
                    <h3 className="text-sm font-semibold">Objectives</h3>
                    <SelectButton
                        items={storageItems}
                        value={settings.objectiveStorage.mode}
                        onChange={(e) => setSettings({ ...settings, objectiveStorage: { ...settings.objectiveStorage, mode: e.value as 'ja' | 'jira' } })}
                    />
                    {settings.objectiveStorage.mode === 'jira' && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <Field label="Issue type">
                                <Dropdown options={issueTypes} value={settings.objectiveStorage.issueTypeId || undefined} onChange={(e) => setSettings({ ...settings, objectiveStorage: { ...settings.objectiveStorage, issueTypeId: e.value as string } })} searchable />
                            </Field>
                            <Field label="Planned value field">
                                <Dropdown options={fieldOptions} value={settings.objectiveStorage.plannedValueField || noField} onChange={(e) => setSettings({ ...settings, objectiveStorage: { ...settings.objectiveStorage, plannedValueField: (e.value as string) || null } })} searchable />
                            </Field>
                            <Field label="Actual value field">
                                <Dropdown options={fieldOptions} value={settings.objectiveStorage.actualValueField || noField} onChange={(e) => setSettings({ ...settings, objectiveStorage: { ...settings.objectiveStorage, actualValueField: (e.value as string) || null } })} searchable />
                            </Field>
                        </div>
                    )}
                </section>

                <section className="flex flex-col gap-3 border-t border-(--border-primary) pt-3">
                    <h3 className="text-sm font-semibold">Risks</h3>
                    <SelectButton items={storageItems} value={settings.riskStorage.mode} onChange={(e) => setSettings({ ...settings, riskStorage: { ...settings.riskStorage, mode: e.value as 'ja' | 'jira' } })} />
                    {settings.riskStorage.mode === 'jira' && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Field label="Issue type">
                                <Dropdown options={issueTypes} value={settings.riskStorage.issueTypeId || undefined} onChange={(e) => setSettings({ ...settings, riskStorage: { ...settings.riskStorage, issueTypeId: e.value as string } })} searchable />
                            </Field>
                            <Field label="ROAM field (select list)" hint="The select options must be named Open, Resolved, Owned, Accepted and Mitigated (or the SAFe names).">
                                <Dropdown
                                    options={[{ label: 'Not stored', value: noField }, ...selectFields]}
                                    value={settings.riskStorage.roamField || noField}
                                    onChange={(e) => setSettings({ ...settings, riskStorage: { ...settings.riskStorage, roamField: (e.value as string) || null } })}
                                    searchable
                                />
                            </Field>
                        </div>
                    )}
                </section>

                <section className="flex flex-col gap-3 border-t border-(--border-primary) pt-3">
                    <h3 className="text-sm font-semibold">Who can change plans</h3>
                    <InputSwitch
                        label="Only the people and groups below (everyone can still view)"
                        checked={settings.editors.restricted}
                        onChange={(e) => setSettings({ ...settings, editors: { ...settings.editors, restricted: e.value } })}
                    />
                    {settings.editors.restricted && (
                        <>
                            <Field label="People">
                                <div className="flex flex-col gap-1">
                                    {editors.map((user) => (
                                        <div key={user.id} className="flex items-center gap-2 text-sm">
                                            <UserAvatar name={user.displayName} avatarUrl={user.avatarUrl} size="sm" />
                                            <span className="flex-1">{user.displayName}</span>
                                            <Button size="xs" layout="plain" leftIcon={<i className="fa fa-times" />} ariaLabel="Remove" onClick={() => setEditors(editors.filter((e) => e.id !== user.id))} />
                                        </div>
                                    ))}
                                    <UserPicker value={null} suggestions={[]} placeholder="Add a person" onChange={(user) => user && !editors.some((e) => e.id === user.id) && setEditors([...editors, user])} />
                                </div>
                            </Field>
                            <Field label="Groups" hint="Jira group names or ids, separated by commas.">
                                <TextInput value={groupText} onChange={(e) => setGroupText(e.value)} placeholder="program-managers" />
                            </Field>
                        </>
                    )}
                </section>
            </div>
        </Modal>
    );
}
