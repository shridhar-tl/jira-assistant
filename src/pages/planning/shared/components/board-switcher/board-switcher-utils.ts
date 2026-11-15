import type { PlannerBoard } from '../../types';

export interface BoardSection {
    title: string;
    boards: PlannerBoard[];
}

export const maxListedBoards = 100;

const typeLabels: Record<PlannerBoard['type'], string> = { scrum: 'Scrum board', kanban: 'Kanban board', simple: 'Team board' };
const typeIcons: Record<PlannerBoard['type'], string> = { scrum: 'fa fa-bolt', kanban: 'fa fa-columns', simple: 'fa fa-users' };

export function getBoardIcon(board: PlannerBoard | null): string {
    return board ? typeIcons[board.type] : 'fa fa-th-large';
}

export function getBoardSubtitle(board: PlannerBoard): string {
    return board.projectKey ? `${typeLabels[board.type]} · ${board.projectKey}` : typeLabels[board.type];
}

function matches(board: PlannerBoard, search: string): boolean {
    return board.name.toLowerCase().includes(search) || !!board.projectKey?.toLowerCase().startsWith(search) || String(board.id) === search;
}

export function buildSections(boards: PlannerBoard[], recentIds: number[], query: string): { sections: BoardSection[]; total: number } {
    const search = query.trim().toLowerCase();
    if (search) {
        const found = boards.filter((b) => matches(b, search));
        return { sections: found.length ? [{ title: 'Matching boards', boards: found.slice(0, maxListedBoards) }] : [], total: found.length };
    }
    const byId = new Map(boards.map((b) => [b.id, b]));
    const recent = recentIds.map((id) => byId.get(id)).filter((b): b is PlannerBoard => !!b);
    const recentSet = new Set(recent.map((b) => b.id));
    const others = boards.filter((b) => !recentSet.has(b.id));
    const sections: BoardSection[] = [];
    if (recent.length) {
        sections.push({ title: 'Recent', boards: recent });
    }
    if (others.length) {
        sections.push({ title: 'All boards', boards: others.slice(0, maxListedBoards) });
    }
    return { sections, total: others.length };
}
