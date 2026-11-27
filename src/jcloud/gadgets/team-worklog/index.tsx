import { lazy, Suspense, useEffect } from 'react';

import { fetchData } from '@/gadgets/WorklogReport/actions';
import { getInitialSettings, useWorklogDispatch, useWorklogGetState, useWorklogStore, withProvider } from '@/gadgets/WorklogReport/datastore';
import Report from '@/gadgets/WorklogReport/Report';
import { withInitParams } from '@/layouts/initialization/index.plugin';

import { BlockLoading } from '@components';

import { getErrorMessage } from '@utils';

import withSimpleAuth from '../../../layouts/authorization/simple-auth';
import GadgetMessage from '../../components/GadgetMessage';
import { type DashboardItemProps, getDashboardHostType, getDashboardItemConfig, isDashboardItemEdit } from '../../dashboard-host';

const EditConfig = lazy(() => import('./EditConfig'));

const reportErrorMessage = 'Unable to generate the report. Look at console log for more details';

function TeamWorklogGadget({ jiraContext }: DashboardItemProps) {
    if (isDashboardItemEdit(jiraContext)) {
        return (
            <Suspense fallback={<BlockLoading text="Loading..." />}>
                <EditConfig hostType={getDashboardHostType(jiraContext)} />
            </Suspense>
        );
    }

    return (
        <div className="h-160 max-h-175 overflow-auto widget:h-full widget:max-h-none">
            <ReportDisplay />
        </div>
    );
}

function ReportDisplay() {
    const { reportLoaded, loadingData, errorTitle, errorMessage } = useWorklogStore();
    const dispatch = useWorklogDispatch();
    const getState = useWorklogGetState();

    useEffect(() => {
        fetchData(dispatch, getState)().catch((err: unknown) => {
            console.error('Error generating worklog report:', err);
            dispatch({ loadingData: false, errorTitle: 'Worklog report', errorMessage: getErrorMessage(err, reportErrorMessage) });
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (errorMessage) {
        return <GadgetMessage icon="fa-exclamation-triangle" variant="error" title={errorTitle} text={errorMessage} />;
    }

    if (loadingData) {
        return <GadgetMessage icon="fa-spinner" spin text="Loading the report. It may take a few seconds based on the range and filters." />;
    }

    if (!reportLoaded) {
        return <GadgetMessage icon="fa-users" text="No data returned matching your filter" />;
    }

    return <Report isLoading={loadingData} />;
}

export default withInitParams(
    withSimpleAuth(
        withProvider(TeamWorklogGadget, undefined, undefined, undefined, ({ jiraContext }: DashboardItemProps) =>
            getInitialSettings(getDashboardItemConfig(jiraContext), { disableAddingWL: true }),
        ),
    ),
);
