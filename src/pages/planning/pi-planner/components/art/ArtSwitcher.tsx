import { Button, Dropdown } from '@components';

import { usePiStore } from '../../pi-store';
import type { PiArt } from '../../pi-types';
import { articleTerm, lowerTerm, type TermSet } from '../../terminology';

export const unassignedArtId = 'unassigned';

interface ArtSwitcherProps {
    artId: string | null;
    terms: TermSet;
    showUnassigned: boolean;
    onChange: (artId: string) => void;
    onEdit: (art: PiArt) => void;
    onCreate: () => void;
}

/** Chooses the ART (program) whose plans are shown, with buttons to edit it or create a new one. */
export default function ArtSwitcher({ artId, terms, showUnassigned, onChange, onEdit, onCreate }: ArtSwitcherProps) {
    const arts = usePiStore((s) => s.arts);
    const canEdit = usePiStore((s) => s.canEdit);
    const art = arts.find((a) => a.id === artId) || null;
    const options = [
        ...arts.map((a) => ({ label: a.name, value: a.id })),
        ...(showUnassigned ? [{ label: `Plans without ${articleTerm(terms.program)}`, value: unassignedArtId }] : []),
    ];

    return (
        <div className="flex min-w-0 items-center gap-1.5">
            <i className="fa fa-sitemap text-(--text-tertiary)" aria-hidden="true" />
            <Dropdown
                className="w-56 max-w-full"
                options={options}
                value={artId ?? undefined}
                placeholder={`Choose ${articleTerm(terms.program)}`}
                emptyMessage={`No ${lowerTerm(terms.programs)} yet`}
                searchable={options.length > 8}
                onChange={(e) => onChange(e.value as string)}
                renderItem={(item) => {
                    const match = arts.find((a) => a.id === item.value);
                    return (
                        <div className="flex min-w-0 flex-col">
                            <span className="truncate">{item.label}</span>
                            {match && (
                                <span className="truncate text-[11px] text-(--text-secondary)">
                                    {match.teams.length} {lowerTerm(match.teams.length === 1 ? terms.team : terms.teams)}
                                </span>
                            )}
                        </div>
                    );
                }}
            />
            {art && canEdit && <Button size="sm" layout="plain" leftIcon={<i className="fa fa-pencil" />} ariaLabel={`Edit ${art.name}`} title={`Edit ${lowerTerm(terms.program)}`} onClick={() => onEdit(art)} />}
            {canEdit && <Button size="sm" layout="plain" leftIcon={<i className="fa fa-plus" />} ariaLabel={`New ${lowerTerm(terms.program)}`} title={`New ${lowerTerm(terms.program)}`} onClick={onCreate} />}
        </div>
    );
}
