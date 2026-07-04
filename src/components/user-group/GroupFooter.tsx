import { Button } from '@components';

interface GroupFooterProps {
    isPlugged: boolean;
    saveGroups: () => void;
    onDone: () => void;
    onReset: () => void;
}

function GroupFooter({ isPlugged, saveGroups, onDone, onReset }: GroupFooterProps) {
    return (
        <div
            className={`flex items-center justify-between gap-4 ${
                isPlugged
                    ? 'border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-3 shrink-0'
                    : 'pt-2'
            }`}
        >
            <div>
                {isPlugged && (
                    <button
                        type="button"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        onClick={onReset}
                        title="Click to clear local changes and reload from saved user groups"
                    >
                        Reset local changes
                    </button>
                )}
            </div>

            <div className="flex items-center gap-3">
                {isPlugged ? (
                    <>
                        <span className="text-xs text-gray-400 dark:text-gray-500 hidden md:inline">
                            To permanently save, go to Settings &rarr; User groups
                        </span>
                        <Button
                            variant="primary"
                            leftIcon={<i className="fa fa-check-circle" />}
                            label="Apply & Close"
                            onClick={onDone}
                            size="sm"
                        />
                    </>
                ) : (
                    <Button variant="primary" leftIcon={<i className="fa fa-save" />} label="Save Changes" onClick={saveGroups} />
                )}
            </div>
        </div>
    );
}

export default GroupFooter;
