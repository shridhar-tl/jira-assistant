import { Link } from '@/controls';

import { inject } from '@services';

interface UpdateDescription {
    id?: number;
    text: string;
}

interface UpdateInfo {
    version: string;
    publishDate?: string;
    expectedOn?: string;
    availableNow?: boolean;
    isBeta?: boolean;
    whatsnew: Array<string | UpdateDescription>;
    bugs?: Array<string | UpdateDescription>;
}

interface UpdatesInfoProps {
    updates: UpdateInfo[];
}

export default function UpdatesInfo({ updates }: UpdatesInfoProps) {
    const { $userutils } = inject('UserUtilsService');

    const getDescription = (desc: string | UpdateDescription, i: number) => {
        let id: number | undefined;
        let text: string;

        if (typeof desc === 'object') {
            id = desc.id;
            text = desc.text;
        } else {
            text = desc;
        }

        return (
            <li key={i} className="mb-1">
                {!!id && (
                    <Link
                        href={`https://github.com/shridhar-tl/jira-assistant/issues/${id}`}
                        className="text-blue-600 hover:text-blue-700 no-underline"
                    >
                        #{id} -
                    </Link>
                )}{' '}
                {text}
            </li>
        );
    };

    return (
        <div className="space-y-6">
            {updates.map((u, i) => (
                <div key={i} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
                    <div className="mb-3">
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{u.version}</span>
                        {u.publishDate && (
                            <span className="ml-2 text-gray-600 dark:text-gray-400">
                                (published: <strong>{$userutils.formatDate(u.publishDate)}</strong>)
                            </span>
                        )}
                        {!u.publishDate && u.expectedOn && (
                            <span className="ml-2 text-gray-600 dark:text-gray-400">
                                (expected: <strong>{$userutils.formatDate(u.expectedOn)}</strong>)
                            </span>
                        )}
                        {u.availableNow && (
                            <span
                                className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded ${u.isBeta ? 'bg-yellow-400 text-black' : 'bg-green-600 text-white'}`}
                                title="Download this version from web store"
                            >
                                now available
                            </span>
                        )}
                    </div>
                    <div className="mb-2">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Changelog:</span>
                        <ul className="list-disc list-inside mt-1 text-gray-700 dark:text-gray-300">{u.whatsnew.map(getDescription)}</ul>
                    </div>
                    {u.bugs && u.bugs.length > 0 && (
                        <div>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Bugs:</span>
                            <ul className="list-disc list-inside mt-1 text-gray-700 dark:text-gray-300">{u.bugs.map(getDescription)}</ul>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
