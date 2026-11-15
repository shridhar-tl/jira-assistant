import { useCallback } from 'react';

import DependencyTable from '../../../shared/components/DependencyTable';
import type { Dependency } from '../../../shared/dependencies';
import { removeDependency } from '../../actions';
import type { BoardModel } from '../../useBoardModel';

interface DependencyListViewProps {
    model: BoardModel;
}

/** Every dependency of the planned issues with its conflict state (PI-4). */
export default function DependencyListView({ model }: DependencyListViewProps) {
    const { data, dependencies } = model;

    const locationOf = useCallback(
        (key: string) => {
            const issue = data.issues[key];
            if (!issue) {
                return 'Other board';
            }
            return issue.currentSprintId ? data.sprints.find((s) => s.id === issue.currentSprintId)?.name || 'Sprint' : 'Backlog';
        },
        [data.issues, data.sprints],
    );

    const remove = useCallback((dep: Dependency) => removeDependency(dep.linkId, dep.typeName, dep.inwardKey, dep.outwardKey), []);

    return (
        <div className="p-3">
            <DependencyTable dependencies={dependencies} issues={data.issues} locationOf={locationOf} canRemove={data.permissions.linkIssues} onRemove={remove} />
        </div>
    );
}
