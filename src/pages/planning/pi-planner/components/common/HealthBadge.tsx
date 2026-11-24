import classNames from 'classnames';

import { dependencyHealthLabels, healthClassNames, objectiveHealthLabels, type DependencyHealth, type ObjectiveHealth } from '../../pi-progress';

interface HealthBadgeProps {
    health: ObjectiveHealth | DependencyHealth;
    className?: string;
}

const labels: Record<ObjectiveHealth | DependencyHealth, string> = { ...objectiveHealthLabels, ...dependencyHealthLabels };

export default function HealthBadge({ health, className }: HealthBadgeProps) {
    return (
        <span className={classNames('inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold', healthClassNames[health], className)} data-health={health}>
            {labels[health]}
        </span>
    );
}
