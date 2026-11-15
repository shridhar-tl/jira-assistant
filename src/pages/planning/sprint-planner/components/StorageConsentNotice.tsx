import { Button } from '@components';

import { isStorageConsentRequired, useStorageConsent } from '../../shared/storage-consent';
import { acceptStorageConsent } from '../actions';

export default function StorageConsentNotice() {
    const accepted = useStorageConsent((s) => s.accepted);
    if (!isStorageConsentRequired || accepted) {
        return null;
    }

    return (
        <div className="mx-3 mt-2 flex flex-col gap-2 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-(--text-primary) sm:flex-row sm:items-center dark:border-amber-700 dark:bg-amber-900/20">
            <div className="min-w-0 flex-1">
                <span className="font-semibold">Planner data is stored in your Jira. </span>
                Team settings and leave are saved as board properties, and planned segments as issue properties. Anyone who can view the board or the issue can read this data.
                Make sure your organization allows storing such data in Jira. Until you accept, you can view everything, but nothing is saved.
            </div>
            <Button label="Accept" size="sm" className="shrink-0 cursor-pointer" onClick={acceptStorageConsent} />
        </div>
    );
}
