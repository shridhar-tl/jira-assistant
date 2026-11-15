import { useEffect, useState, type ReactNode } from 'react';

import { Button, Drawer, Dropdown, InputSwitch, Multiselect, NumericInput, SelectButton } from '@components';

import Field from '../../shared/components/Field';
import { getDateFieldOptions, getIssueLinkTypes } from '../../shared/jira-api';
import type { BarColorMode, CardDensity, IssueLinkType, SubtaskMode } from '../../shared/types';
import { isStorageConsentRequired, useStorageConsent } from '../../shared/storage-consent';
import { acceptStorageConsent, changeSettings, withdrawStorageConsent } from '../actions';
import { allCardFields, type CardField } from '../planner-settings';
import { usePlannerStore } from '../store';

interface PlannerSettingsDrawerProps {
    open: boolean;
    onClose: () => void;
}

const subtaskItems = [
    { label: 'Roll up into parent', value: 'rollup' },
    { label: 'Own cards', value: 'cards' },
];
const densityItems = [
    { label: 'Detailed', value: 'detailed' },
    { label: 'Compact', value: 'compact' },
];
const colorItems = [
    { label: 'Status', value: 'status' },
    { label: 'Epic', value: 'epic' },
    { label: 'Assignee load', value: 'load' },
];
const hierarchyLevels = [
    { label: 'Epic (level 1)', value: 1 },
    { label: 'Level 2', value: 2 },
    { label: 'Level 3', value: 3 },
    { label: 'Level 4', value: 4 },
];
const noStartField = '';
const drawerBodyStyle = { padding: '0.75rem 1rem' };

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="flex flex-col gap-3 border-b border-(--border-primary) pb-4">
            <h3 className="text-sm font-semibold text-(--text-primary)">{title}</h3>
            {children}
        </section>
    );
}

export default function PlannerSettingsDrawer({ open, onClose }: PlannerSettingsDrawerProps) {
    const settings = usePlannerStore((s) => s.settings);
    const consentAccepted = useStorageConsent((s) => s.accepted);
    const [dateFields, setDateFields] = useState<{ value: string; label: string }[]>([]);
    const [linkTypes, setLinkTypes] = useState<IssueLinkType[]>([]);

    useEffect(() => {
        if (!open) {
            return;
        }
        getDateFieldOptions().then(setDateFields).catch(console.error);
        getIssueLinkTypes().then(setLinkTypes).catch(console.error);
    }, [open]);

    const linkType = settings.dependencyLinkTypes[0];

    return (
        <Drawer open={open} onClose={onClose} position="right" size="400px" title="Planner settings" bodyStyle={drawerBodyStyle}>
            <div className="flex flex-col gap-4">
                <Section title="Board">
                    <Field label="Subtasks">
                        <SelectButton items={subtaskItems} value={settings.subtaskMode} onChange={(e) => changeSettings({ subtaskMode: e.value as SubtaskMode })} />
                    </Field>
                    <Field label="Card density">
                        <SelectButton items={densityItems} value={settings.cardDensity} onChange={(e) => changeSettings({ cardDensity: e.value as CardDensity })} />
                    </Field>
                    <Field label="Fields shown on cards">
                        <Multiselect options={allCardFields} value={settings.cardFields} onChange={(e) => changeSettings({ cardFields: e.value as CardField[] })} />
                    </Field>
                    <InputSwitch label="Show closed sprints (read only)" checked={settings.showClosedSprints} onChange={(e) => changeSettings({ showClosedSprints: e.value })} />
                    <InputSwitch label="Show the parent (epic) strip" checked={settings.showEpicStrip} onChange={(e) => changeSettings({ showEpicStrip: e.value })} />
                    <InputSwitch label="Show dependency lines between cards" checked={settings.showDependencyLines} onChange={(e) => changeSettings({ showDependencyLines: e.value })} />
                    <Field label="Backlog items loaded at a time" hint="More are loaded on demand with Load more.">
                        <NumericInput value={settings.backlogLimit} min={25} max={500} step={25} onChange={(e) => e.value && changeSettings({ backlogLimit: e.value })} />
                    </Field>
                </Section>

                <Section title="Dates">
                    <Field label="Start date field" hint="Leave empty to use the field named Start date.">
                        <Dropdown
                            options={[{ value: noStartField, label: 'Default (Start date)' }, ...dateFields]}
                            value={settings.startDateField}
                            onChange={(e) => changeSettings({ startDateField: e.value as string })}
                            searchable
                        />
                    </Field>
                    <Field label="Due date field">
                        <Dropdown options={dateFields.length ? dateFields : [{ value: 'duedate', label: 'Due date' }]} value={settings.dueDateField} onChange={(e) => changeSettings({ dueDateField: e.value as string })} searchable />
                    </Field>
                    <Field label="Lead time for derived dates (working days)" hint="0 derives the duration from the remaining estimate.">
                        <NumericInput value={settings.leadTimeDays} min={0} max={60} onChange={(e) => changeSettings({ leadTimeDays: e.value ?? 0 })} />
                    </Field>
                    <InputSwitch label="Keep Jira start / due dates in sync with planned segments" checked={settings.syncNativeDates} onChange={(e) => changeSettings({ syncNativeDates: e.value })} />
                </Section>

                <Section title="Dependencies">
                    <Field label="Issue link type used for dependencies">
                        <Dropdown
                            options={(linkTypes.length ? linkTypes : [{ id: 'blocks', name: linkType.name, inward: '', outward: '' }]).map((t) => ({
                                value: t.name,
                                label: t.outward ? `${t.name} (${t.outward} / ${t.inward})` : t.name,
                            }))}
                            value={linkType.name}
                            onChange={(e) => changeSettings({ dependencyLinkTypes: [{ name: e.value as string, outwardBlocks: linkType.outwardBlocks }] })}
                        />
                    </Field>
                    <InputSwitch
                        label={`"${linkTypes.find((t) => t.name === linkType.name)?.outward || 'outward'}" means the issue blocks the other`}
                        checked={linkType.outwardBlocks}
                        onChange={(e) => changeSettings({ dependencyLinkTypes: [{ name: linkType.name, outwardBlocks: e.value }] })}
                    />
                    <InputSwitch label="Forecast respects dependencies" checked={settings.dependencyAwareForecast} onChange={(e) => changeSettings({ dependencyAwareForecast: e.value })} />
                </Section>

                <Section title="Roadmap">
                    <Field label="Hierarchy levels shown">
                        <Multiselect options={hierarchyLevels} value={settings.roadmapLevels} onChange={(e) => changeSettings({ roadmapLevels: (e.value as number[]).length ? (e.value as number[]) : [1] })} />
                    </Field>
                    <Field label="Bar colour">
                        <SelectButton items={colorItems} value={settings.barColorMode} onChange={(e) => changeSettings({ barColorMode: e.value as BarColorMode })} />
                    </Field>
                </Section>

                <Section title="Forecast">
                    <Field label="Sprints to forecast">
                        <NumericInput value={settings.forecastSprintCount} min={1} max={12} onChange={(e) => e.value && changeSettings({ forecastSprintCount: e.value })} />
                    </Field>
                </Section>

                <Section title="Draft mode">
                    <InputSwitch label="Open the planner in draft mode" checked={settings.draftByDefault} onChange={(e) => changeSettings({ draftByDefault: e.value })} />
                </Section>

                {isStorageConsentRequired && (
                    <Section title="Data stored in Jira">
                        <p className="text-sm text-(--text-secondary)">
                            Team settings and leave are saved as board properties, and planned segments as issue properties. Anyone who can view the board or the issue can
                            read them.
                        </p>
                        {consentAccepted ? (
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                <span className="me-auto">
                                    Accepted{settings.storageConsentAt ? ` on ${new Date(settings.storageConsentAt).toLocaleDateString()}` : ''}. Changes are saved.
                                </span>
                                <Button label="Withdraw" size="sm" layout="outlined" variant="danger" onClick={withdrawStorageConsent} />
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                <span className="me-auto">Not accepted. Nothing is saved.</span>
                                <Button label="Accept" size="sm" onClick={acceptStorageConsent} />
                            </div>
                        )}
                    </Section>
                )}
            </div>
        </Drawer>
    );
}
