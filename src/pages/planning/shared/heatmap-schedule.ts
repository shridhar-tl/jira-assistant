import type { HeatmapSchedule, HeatmapUser } from '@/gadgets/WorkloadHeatmap/types';

import { getDayAvailability, toTeamMember } from './availability';
import { buildBoardLeaveIndex, loadLeave } from './board-loader';
import { loadTeamDefinition } from './team-store';

/**
 * People schedule of a board's team for the Workload Heatmap: hours per day, working days, allocation, leave and holidays.
 * Returns null when the team has never been set up in the planner, so the heatmap keeps its own defaults.
 */
export async function loadHeatmapSchedule(boardId: number, users: HeatmapUser[], start: Date, end: Date): Promise<HeatmapSchedule | null> {
    const team = await loadTeamDefinition(boardId);
    if (!team.updated) {
        return null;
    }

    const members = users.map((u) => toTeamMember({ id: u.id, displayName: u.displayName, avatarUrl: u.avatarUrl }, team));
    const leave = await loadLeave(boardId, team, members, [{ start, end }]);
    const index = buildBoardLeaveIndex(leave);
    const memberMap = new Map(members.map((m) => [m.id, m]));

    return {
        getDay: (userId, date) => {
            const member = memberMap.get(userId);
            if (!member) {
                return null;
            }
            const day = getDayAvailability(member, date, team, index);
            const absences = [...day.leave, ...day.holidays];
            return {
                capacitySeconds: day.availableHours * 3600,
                isWorkingDay: day.isWorkingDay,
                absence: absences.length ? (day.availableHours <= 0 ? (day.holidays.length ? 'holiday' : 'leave') : 'partial') : undefined,
                absenceTitle: absences.length ? absences.map((a) => a.title).join(', ') : undefined,
            };
        },
    };
}
