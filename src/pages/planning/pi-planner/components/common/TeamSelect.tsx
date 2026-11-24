import { useState } from 'react';

import { Dropdown } from '@components';

import BoardPicker from '../../../shared/components/BoardPicker';
import { usePiStore } from '../../pi-store';
import type { PiDocument, PiTeamRef } from '../../pi-types';
import { lowerTerm, type TermSet } from '../../terminology';

interface TeamSelectProps {
    doc: PiDocument;
    value: PiTeamRef | null;
    onChange: (team: PiTeamRef | null) => void;
    terms: TermSet;
    excludeBoardId?: number | null;
    placeholder?: string;
    clearable?: boolean;
}

const otherBoardValue = -1;

/**
 * Chooses a team anywhere in the program: the teams of this plan, the teams of the other ARTs, or any other scrum board.
 * Picking a team of another ART makes the item cross-ART.
 */
export default function TeamSelect({ doc, value, onChange, terms, excludeBoardId, placeholder = 'Choose a team', clearable }: TeamSelectProps) {
    const arts = usePiStore((s) => s.arts);
    const planBoards = new Set(doc.teams.map((t) => t.boardId));
    const known = new Set<number>(planBoards);
    const groups = [
        { label: `This ${lowerTerm(terms.plan)}`, items: doc.teams.filter((t) => t.boardId !== excludeBoardId).map((t) => ({ label: t.name, value: t.boardId })) },
        ...arts
            .map((art) => {
                const items = art.teams.filter((t) => !known.has(t.boardId) && t.boardId !== excludeBoardId).map((t) => ({ label: t.name, value: t.boardId }));
                items.forEach((i) => known.add(i.value));
                return { label: art.name, items };
            })
            .filter((g) => g.items.length > 0),
        { label: 'Elsewhere', items: [{ label: 'Another board…', value: otherBoardValue }] },
    ];
    const isOther = !!value && !known.has(value.boardId);
    const [pickOther, setPickOther] = useState(isOther);

    const teamsByBoard = new Map<number, PiTeamRef>([...arts.flatMap((a) => a.teams), ...doc.teams].map((t) => [t.boardId, { boardId: t.boardId, name: t.name }]));

    return (
        <div className="flex flex-col gap-1.5">
            <Dropdown
                options={groups}
                value={pickOther ? otherBoardValue : value?.boardId}
                placeholder={placeholder}
                searchable
                showClear={clearable}
                onChange={(e) => {
                    const boardId = e.value as number | null | undefined;
                    if (boardId === null || boardId === undefined) {
                        setPickOther(false);
                        onChange(null);
                        return;
                    }
                    if (boardId === otherBoardValue) {
                        setPickOther(true);
                        onChange(null);
                        return;
                    }
                    setPickOther(false);
                    onChange(teamsByBoard.get(boardId) || null);
                }}
            />
            {pickOther && (
                <BoardPicker scrumOnly value={value?.boardId ?? null} onChange={(board) => onChange(board ? { boardId: board.id, name: board.name } : null)} placeholder="Find the team's board" />
            )}
        </div>
    );
}
