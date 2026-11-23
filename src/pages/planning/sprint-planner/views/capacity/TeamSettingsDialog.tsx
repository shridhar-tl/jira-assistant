import { useState } from 'react';

import { Button, Modal, TabPage, TabView } from '@components';

import type { StoredCalendarEvent, TeamDefinition } from '../../../shared/types';
import { saveTeam } from '../../actions';
import { usePlannerStore } from '../../store';
import type { BoardModel } from '../../useBoardModel';

import LeaveSourcesTab from './team/LeaveSourcesTab';
import MembersTab from './team/MembersTab';
import PlanningTab from './team/PlanningTab';

interface TeamSettingsDialogProps {
    model: BoardModel;
    onHide: () => void;
}

export default function TeamSettingsDialog({ model, onHide }: TeamSettingsDialogProps) {
    const { data } = model;
    const readOnlyReason = usePlannerStore((s) => s.teamReadOnlyReason);
    const [team, setTeam] = useState<TeamDefinition>(data.team);
    const [imports, setImports] = useState<Record<string, StoredCalendarEvent[]>>({});
    const [isSaving, setIsSaving] = useState(false);

    const save = async () => {
        setIsSaving(true);
        const ok = await saveTeam(team, imports);
        setIsSaving(false);
        if (ok) {
            onHide();
        }
    };

    const footer = (
        <div className="flex items-center justify-end gap-2">
            {readOnlyReason && <span className="me-auto text-xs text-amber-600 dark:text-amber-400">{readOnlyReason}</span>}
            {data.team.updated && !readOnlyReason && (
                <span className="me-auto text-[11px] text-(--text-tertiary)">Last saved {new Date(data.team.updated).toLocaleString()}</span>
            )}
            <Button label="Cancel" layout="plain" onClick={onHide} />
            <Button label="Save" isLoading={isSaving} disabled={isSaving} onClick={save} />
        </div>
    );

    return (
        <Modal isOpen onClose={onHide} title={`Team · ${data.board.name}`} size="lg" footer={footer}>
            <TabView>
                <TabPage header="Members">
                    <div className="pt-3">
                        <MembersTab team={team} data={data} onChange={setTeam} />
                    </div>
                </TabPage>
                <TabPage header="Schedule & planning">
                    <div className="pt-3">
                        <PlanningTab team={team} onChange={setTeam} />
                    </div>
                </TabPage>
                <TabPage header="Leave calendars">
                    <div className="pt-3">
                        <LeaveSourcesTab
                            team={team}
                            members={data.members}
                            imports={imports}
                            onChange={setTeam}
                            onImport={(sourceId, events) =>
                                setImports((current) => {
                                    const next = { ...current };
                                    if (events) {
                                        next[sourceId] = events;
                                    } else {
                                        delete next[sourceId];
                                    }
                                    return next;
                                })
                            }
                        />
                    </div>
                </TabPage>
            </TabView>
        </Modal>
    );
}
