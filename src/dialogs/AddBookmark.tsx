import { useCallback, useState } from 'react';

import { inject } from '@services';

import { Button, Modal } from '@components';

import { MultiValueText } from '../controls/MultiValueText';

interface AddBookmarkProps {
    onHide?: (result?: boolean) => void;
}

export default function AddBookmark({ onHide }: AddBookmarkProps) {
    const [ticketsList, setTicketsList] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDialog, setShowDialog] = useState(true);

    const { $bookmark, $message, $analytics } = inject('BookmarkService', 'MessageService', 'AnalyticsService');

    $analytics.trackEvent('Dialog opened', 'Dialog', 'Add Bookmark');

    const handleHide = useCallback(
        (result?: boolean) => {
            setShowDialog(false);
            onHide?.(result);
        },
        [onHide],
    );

    const addBookmark = useCallback(async () => {
        if (ticketsList.length > 0) {
            setIsLoading(true);

            try {
                const result = await $bookmark.addBookmark(ticketsList);

                if (result.length === 0) {
                    handleHide(true);
                } else {
                    setIsLoading(false);
                    setTicketsList(result);

                    if (ticketsList.length === result.length) {
                        $message.warning('None of the ticket numbers provided are valid.');
                    } else if (ticketsList.length > result.length) {
                        $message.warning('Some of the ticket numbers provided are not valid.');
                    }
                }
            } catch {
                setIsLoading(false);
            }
        } else {
            handleHide();
        }
    }, [ticketsList, $bookmark, $message, handleHide]);

    return (
        <Modal isOpen={showDialog} onClose={handleHide} title="Add Bookmark" size="sm">
            <div className="flex flex-col gap-4">
                <div className="p-6">
                    <MultiValueText
                        value={ticketsList}
                        onChange={setTicketsList}
                        className="mb-2"
                        minItemLength={4}
                        useUpperCase
                        placeholder="Enter one or more ticket numbers"
                    />
                    <div className="mt-2 text-sm text-secondary">
                        <strong>Note:</strong> Press enter key to add multiple items
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-(--border-color)">
                    <Button variant="secondary" onClick={() => handleHide()} leftIcon={<i className="fa fa-times" />}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={addBookmark} disabled={isLoading} leftIcon={<i className="fa fa-save" />}>
                        Save
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
