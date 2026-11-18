import { Button } from '@components';

interface InitializationErrorProps {
    message: string;
    retry: () => void;
}

export default function InitializationError({ message, retry }: InitializationErrorProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-(--bg-secondary) p-4">
            <div className="w-full max-w-md rounded-2xl border border-(--border-color) bg-(--bg-primary) shadow-xl overflow-hidden">
                <div className="flex flex-col items-center px-6 sm:px-8 pt-8 pb-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
                        <i className="fa fa-exclamation-triangle text-3xl" />
                    </div>
                    <h2 className="mt-5 text-lg font-semibold text-(--text-primary)">Unable to load Jira Assistant</h2>
                </div>

                <div className="px-6 sm:px-8 pb-6">
                    <p className="text-sm leading-relaxed text-(--text-secondary) text-center">
                        An error occurred while starting Jira Assistant. Resolve the issue mentioned below and try again.
                    </p>
                    <p
                        className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 break-words dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                        data-testid="init-error-message"
                    >
                        {message}
                    </p>

                    <div className="mt-6">
                        <Button variant="primary" leftIcon={<i className="fa fa-refresh" />} label="Try Again" onClick={retry} fullWidth />
                    </div>
                </div>
            </div>
        </div>
    );
}
