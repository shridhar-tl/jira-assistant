import { Button } from '@components';

interface WorkloadHeatmapInfoProps {
    title: string;
    message: string;
    icon?: string;
    actionLabel?: string;
    onAction?: () => void;
}

const howItWorks = [
    'Remaining estimate (or original estimate when remaining is not set) of each issue is spread evenly across the working days between its start date and due date.',
    'When only a due date is available, the work is planned backwards from the due date using the configured lead time (or estimate ÷ daily capacity).',
    'Work is only planned from today onwards. Remaining work of overdue issues is placed on today.',
    'Each cell compares the planned hours against the daily capacity from your worklog settings.',
];

export default function WorkloadHeatmapInfo({ title, message, icon = 'fa-th', actionLabel, onAction }: WorkloadHeatmapInfoProps) {
    return (
        <div className="flex min-h-0 flex-1 flex-col items-center gap-4 overflow-auto px-4 py-10 text-center">
            <span className={`fa ${icon} text-3xl text-(--text-tertiary)`} />
            <div className="max-w-xl">
                <div className="text-base font-semibold text-(--text-primary)">{title}</div>
                <p className="mt-1 text-sm text-(--text-secondary)">{message}</p>
            </div>
            {actionLabel && onAction && <Button label={actionLabel} leftIcon={<i className="fa fa-cogs" />} onClick={onAction} />}
            <ul className="max-w-xl list-disc space-y-1 ps-5 text-left text-xs text-(--text-secondary)">
                {howItWorks.map((text) => (
                    <li key={text}>{text}</li>
                ))}
            </ul>
        </div>
    );
}
