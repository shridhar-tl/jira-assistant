import { useEffect, useState } from 'react';

import { useNavigate, useParams } from 'react-router';

import { Loading } from '@components';

import { getAllBoards } from '../shared/jira-api';
import type { PlannerBoard } from '../shared/types';

/** Entry from the Forge project page: opens the planner pre-scoped to the project's board, or lets the user pick one of its boards. */
export default function ProjectPlannerRedirect() {
    const { userId, projectKey } = useParams();
    const navigate = useNavigate();
    const [boards, setBoards] = useState<PlannerBoard[] | null>(null);

    useEffect(() => {
        let cancelled = false;
        getAllBoards()
            .then((all) => {
                if (cancelled) {
                    return;
                }
                const projectBoards = all.filter((b) => b.projectKey === projectKey);
                const preferred = projectBoards.filter((b) => b.type !== 'kanban');
                if (projectBoards.length === 1 || preferred.length === 1) {
                    const board = preferred[0] || projectBoards[0];
                    navigate(`/${userId}/planning/sprint-planner/${board.id}/${board.type === 'kanban' ? 'capacity' : 'board'}`, { replace: true });
                } else {
                    setBoards(projectBoards);
                }
            })
            .catch((err) => {
                console.error('Unable to load the boards of the project', err);
                setBoards([]);
            });
        return () => {
            cancelled = true;
        };
    }, [projectKey, userId]);

    if (!boards) {
        return <Loading />;
    }

    return (
        <div className="mx-auto flex max-w-lg flex-col gap-3 p-6">
            <h2 className="text-lg font-semibold">Plan {projectKey}</h2>
            {boards.length ? (
                <>
                    <p className="text-sm text-(--text-secondary)">This project has several boards. Choose the team to plan.</p>
                    {boards.map((board) => (
                        <button
                            type="button"
                            key={board.id}
                            className="cursor-pointer rounded border border-(--border-primary) px-3 py-2 text-left hover:bg-(--bg-hover)"
                            onClick={() => navigate(`/${userId}/planning/sprint-planner/${board.id}/${board.type === 'kanban' ? 'capacity' : 'board'}`)}
                        >
                            {board.name} <span className="text-xs text-(--text-secondary)">({board.type})</span>
                        </button>
                    ))}
                </>
            ) : (
                <p className="text-sm text-(--text-secondary)">There is no board for this project that you can see. Create a board in Jira to plan its sprints.</p>
            )}
        </div>
    );
}
