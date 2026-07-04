import { useEffect, useMemo, useState } from 'react';

import { inject } from '@services';

import { Button } from '@components';

import { getGitHubIssueUrl, isWebBuild, redirectToRoute } from '@constants';

import { Link } from '@controls';

interface UnauthorizedPageProps {
    jiraUrl?: string;
    validate: () => void;
}

export default function UnauthorizedPage({ jiraUrl, validate }: UnauthorizedPageProps) {
    const { $jaBrowserExtn, $session } = inject('AppBrowserService', 'SessionService');

    const effectiveUrl = useMemo(() => jiraUrl || $session.rootUrl || '', [jiraUrl, $session.rootUrl]);

    const [hasPermission, setHasPermission] = useState(!!effectiveUrl);

    useEffect(() => {
        if (effectiveUrl) {
            $jaBrowserExtn.requestPermission(null, effectiveUrl).then(setHasPermission);
        }
    }, [effectiveUrl, $jaBrowserExtn]);

    const grantPermission = async () => {
        if (!effectiveUrl) return;
        const granted = await $jaBrowserExtn.requestPermission(null, effectiveUrl);
        setHasPermission(granted);
        if (granted) {
            redirectToRoute();
        }
    };

    const issueLink = (
        <Link
            className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-xs font-semibold no-underline transition-colors hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:hover:bg-amber-500/25"
            href={getGitHubIssueUrl('214')}
        >
            #214
        </Link>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)] p-4">
            <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-xl overflow-hidden">
                <div className="flex flex-col items-center px-6 sm:px-8 pt-8 pb-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400">
                        <i className="fa fa-lock text-3xl" />
                    </div>
                    <h1 className="mt-5 text-5xl font-extrabold tracking-tight text-[var(--text-primary)]">401</h1>
                    <h2 className="mt-1 text-lg font-semibold text-[var(--text-secondary)]">Unauthenticated</h2>
                </div>

                <div className="px-6 sm:px-8 pb-6">
                    <p className="text-sm leading-relaxed text-[var(--text-secondary)] text-center">
                        {hasPermission ? (
                            <>
                                You are not authenticated in Jira. Before you start using Jira Assistant, please login to Jira and then come
                                back to the dashboard. If the issue persists, see {issueLink} for more details.
                            </>
                        ) : (
                            <>
                                Jira Assistant has not been granted permission to access{' '}
                                {effectiveUrl ? (
                                    <span className="font-medium text-[var(--text-primary)] break-all">{effectiveUrl}</span>
                                ) : (
                                    'your Jira instance'
                                )}
                                . Please {isWebBuild ? 'open the Jira Assistant extension and ' : ''}grant permission before trying again. More
                                details available in issue {issueLink}.
                            </>
                        )}
                    </p>

                    <div className="mt-6 flex flex-col gap-2.5">
                        {!isWebBuild && !hasPermission && (
                            <Button
                                variant="warning"
                                leftIcon={<i className="fa fa-unlock" />}
                                label="Grant permission"
                                fullWidth
                                onClick={grantPermission}
                            />
                        )}
                        <div className="flex flex-col sm:flex-row gap-2.5">
                            <Button
                                variant="secondary"
                                layout="outlined"
                                leftIcon={<i className="fa fa-refresh" />}
                                label="Try Again"
                                onClick={validate}
                                fullWidth
                            />
                            <Button
                                variant="success"
                                leftIcon={<i className="fa fa-external-link" />}
                                label="Open Jira"
                                href={effectiveUrl || undefined}
                                newTab
                                disabled={!effectiveUrl}
                                fullWidth
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
