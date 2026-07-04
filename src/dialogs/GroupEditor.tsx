import { useEffect, useState } from 'react';

import type { UserGroup as UserGroupType } from '@/types';

import { inject } from '@services';

import { Modal } from '@components';

import UserGroup from '../components/user-group/UserGroup';
import { EventCategory } from '../constants/settings';

interface GroupEditorProps {
    groups?: UserGroupType[];
    onHide?: (groups?: UserGroupType[]) => void;
}

function GroupEditor({ groups: initialGroups, onHide }: GroupEditorProps) {
    const [isOpen, setIsOpen] = useState(true);
    const { $analytics } = inject('AnalyticsService');

    useEffect(() => {
        $analytics.trackEvent('Dialog opened', EventCategory.DialogEvents, 'Add users');
    }, [$analytics]);

    const handleClose = (result?: UserGroupType[]) => {
        if (result && (result as any).nativeEvent) {
            result = undefined;
        }
        setIsOpen(false);
        onHide?.(result);
    };

    const handleDone = (groups: UserGroupType[]) => {
        handleClose(groups);
    };

    return (
        <Modal isOpen={isOpen} onClose={() => handleClose()} title="Manage User Groups" size="xl">
            <div className="modal-wide -m-6">
                <UserGroup groups={initialGroups} isPlugged={true} onDone={handleDone} />
            </div>
        </Modal>
    );
}

export default GroupEditor;
