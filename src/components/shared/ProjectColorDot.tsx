import { inject } from '@services';

import { Badge } from '@components';

import { getProjectColor } from '@utils';

interface ProjectColorDotProps {
    ticketNo?: string;
    className?: string;
}

export default function ProjectColorDot({ ticketNo, className }: ProjectColorDotProps) {
    const { $session } = inject('SessionService');
    const color = getProjectColor(ticketNo, $session.CurrentUser.projectColors);
    if (!color) return null;

    return <Badge dot size="md" color={color} className={className} title="Project color" data-project-color={color} />;
}
