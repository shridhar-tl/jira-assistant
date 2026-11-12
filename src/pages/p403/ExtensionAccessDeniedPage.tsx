import { Button } from '@components';

interface ExtensionAccessDeniedPageProps {
    reason: string;
    validate: () => void;
    chooseIntegration: () => void;
}

export default function ExtensionAccessDeniedPage({ reason, validate, chooseIntegration }: ExtensionAccessDeniedPageProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-(--bg-secondary) p-4">
            <div className="w-full max-w-md rounded-2xl border border-(--border-color) bg-(--bg-primary) shadow-xl overflow-hidden">
                <div className="flex flex-col items-center px-6 sm:px-8 pt-8 pb-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
                        <i className="fa fa-ban text-3xl" />
                    </div>
                    <h1 className="mt-5 text-5xl font-extrabold tracking-tight text-(--text-primary)">403</h1>
                    <h2 className="mt-1 text-lg font-semibold text-(--text-secondary)">Extension access denied</h2>
                </div>

                <div className="px-6 sm:px-8 pb-6">
                    <p className="text-sm leading-relaxed text-(--text-secondary) text-center">
                        Jira Assistant extension has refused to serve this site. Hence Jira Assistant cannot be used from here until access is
                        allowed in the extension.
                    </p>
                    <p
                        className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 break-words dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                        data-testid="extn-access-denied-reason"
                    >
                        {reason}
                    </p>

                    <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
                        <Button
                            variant="secondary"
                            layout="outlined"
                            leftIcon={<i className="fa fa-refresh" />}
                            label="Try Again"
                            onClick={validate}
                            fullWidth
                        />
                        <Button
                            variant="primary"
                            leftIcon={<i className="fa fa-plug" />}
                            label="Choose integration"
                            onClick={chooseIntegration}
                            fullWidth
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
