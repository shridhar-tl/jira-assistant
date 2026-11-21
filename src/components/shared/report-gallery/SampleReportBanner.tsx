import { Button } from '@components';

interface SampleReportBannerProps {
    title: string;
    onSave: () => void;
    onBack: () => void;
}

export default function SampleReportBanner({ title, onSave, onBack }: SampleReportBannerProps) {
    return (
        <div
            className="mx-3 mt-3 flex flex-col gap-3 rounded-lg border border-(--primary-color)/40 bg-(--primary-color)/10 p-3 sm:mx-4 sm:flex-row sm:items-center"
            role="status"
        >
            <i className="fa fa-wand-magic-sparkles hidden text-(--primary-color) sm:block" />
            <div className="min-w-0 flex-1 text-sm text-(--text-primary)">
                <strong>&quot;{title}&quot; is a sample report.</strong>{' '}
                <span className="text-(--text-secondary)">
                    Run it as it is, or change it as you need. Nothing is saved until you save it, which creates your own copy under My reports.
                </span>
            </div>
            <div className="flex gap-2">
                <Button size="sm" layout="plain" leftIcon={<i className="fa fa-arrow-left" />} label="All reports" onClick={onBack} />
                <Button size="sm" leftIcon={<i className="fa fa-save" />} label="Save as my report" onClick={onSave} />
            </div>
        </div>
    );
}
