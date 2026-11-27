import { useCallback, useEffect, useMemo } from 'react';

import { Modal } from '@forge/bridge';

import { groupsChanged } from '@/gadgets/WorklogReport/actions';
import {
    getSettingsObj,
    getSprintsList,
    useWorklogDispatch,
    useWorklogGetState,
    useWorklogStore,
    type WorklogReportState,
} from '@/gadgets/WorklogReport/datastore';
import CustomActions from '@/gadgets/WorklogReport/settings/CustomActions';
import type { UserGroup } from '@/types';

import { Button } from '@components';

import ConfigPanel from '../../components/ConfigPanel';
import ConfigSection from '../../components/ConfigSection';
import type { DashboardHostType } from '../../dashboard-host';
import useDashboardItemConfig from '../../useDashboardItemConfig';

interface EditConfigProps {
    hostType: DashboardHostType;
}

const noop = () => undefined;

export default function EditConfig({ hostType }: EditConfigProps) {
    const state = useWorklogStore();
    const dispatch = useWorklogDispatch();
    const getState = useWorklogGetState();
    const config = useMemo(() => getSettingsObj(state, { incUserGroups: true }), [state]);
    const { saveError, isWidget, update, submit } = useDashboardItemConfig({ hostType, initialSettings: config });

    useEffect(() => update(config), [config, update]);

    const showReportSettings = useCallback(() => {
        new Modal({
            onClose: (modifiedSettings?: Partial<WorklogReportState>) => {
                if (modifiedSettings) {
                    dispatch(modifiedSettings);
                    dispatch(getSprintsList(getState()));
                }
            },
            size: 'large',
            context: { modalId: 'ja-dlg-wl-report-config', settings: getSettingsObj(getState(), { incUserGroups: true }) },
        }).open();
    }, [dispatch, getState]);

    const showUserGroups = useCallback(() => {
        new Modal({
            onClose: (result?: { userGroups?: UserGroup[] }) => {
                if (result?.userGroups) {
                    groupsChanged(dispatch)(result.userGroups);
                }
            },
            size: 'max',
            context: { modalId: 'ja-dlg-user-groups', groups: getState().userGroups },
        }).open();
    }, [dispatch, getState]);

    const groupCount = state.userGroups?.length || 0;

    return (
        <ConfigPanel saveError={saveError} onSubmit={isWidget ? undefined : submit}>
            <ConfigSection
                icon="fa-calendar-alt"
                title="Report period"
                description={state.timeframeType === '1' ? 'Choose the boards and sprints to report on.' : 'Choose the date range to report on.'}
            >
                <div className="flex flex-wrap items-center gap-2">
                    <CustomActions onInputChanged={noop} showGroupsPopup={showUserGroups} />
                </div>
            </ConfigSection>
            <ConfigSection
                icon="fa-users"
                title="Users and report settings"
                description={`${groupCount} user group${groupCount === 1 ? '' : 's'} configured. Use Settings for the data source, formatting, fields and filters.`}
            >
                <div className="flex flex-wrap items-center gap-3">
                    <Button layout="outlined" leftIcon={<i className="fa fa-users" />} onClick={showUserGroups}>
                        User Groups
                    </Button>
                    <Button layout="outlined" leftIcon={<i className="fa fa-cogs" />} onClick={showReportSettings}>
                        Settings
                    </Button>
                </div>
            </ConfigSection>
        </ConfigPanel>
    );
}
