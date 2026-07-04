import 'moment-timezone/builds/moment-timezone-with-data.min.js';

import { useCallback } from 'react';

import { FullContext, view } from '@forge/bridge';

import UserGroup from '@/components/user-group/UserGroup';
import { withInitParams } from '@/layouts/initialization/index.plugin';
import type { UserGroup as UserGroupType } from '@/types';

import withSimpleAuth from '../../layouts/authorization/simple-auth';

interface UserGroupModalProps {
    jiraContext: FullContext;
}

function UserGroupModal({ jiraContext }: UserGroupModalProps) {
    const groups = jiraContext?.extension?.modal?.groups;

    const onDone = useCallback((userGroups: UserGroupType[]) => {
        view.close({ userGroups });
    }, []);

    return (
        <div className="min-h-150">
            <UserGroup isPlugged={true} groups={groups} onDone={onDone} />
        </div>
    );
}

export default withInitParams(withSimpleAuth(UserGroupModal));
