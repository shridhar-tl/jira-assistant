import CookieIntegration from './CookieIntegration';
import IntegrateFooter from './IntegrateFooter';

interface IntegratePageProps {
    setAuthType?: (authType: string) => void;
}

export default function IntegratePage({ setAuthType }: IntegratePageProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/30 dark:bg-blue-900/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-[520px]">
                <div className="bg-[var(--bg-primary)]/95 backdrop-blur-sm rounded-2xl shadow-[var(--shadow-xl)] overflow-hidden border border-[var(--border-primary)]">
                    <div className="p-6 sm:p-8">
                        <CookieIntegration setAuthType={setAuthType} />
                    </div>
                    <IntegrateFooter />
                </div>
            </div>
        </div>
    );
}
