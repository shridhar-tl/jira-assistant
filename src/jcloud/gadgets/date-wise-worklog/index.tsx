import { useMemo } from 'react';

import { UserDateWiseWorklog } from '@/components/shared';
import { withInitParams } from '@/layouts/initialization/index.plugin';

import withSimpleAuth from '../../../layouts/authorization/simple-auth';
import DateRangeConfig, { type DateRangeGadgetSettings } from '../../components/DateRangeConfig';
import { type DashboardItemProps, getDashboardHostType, getDashboardItemConfig, isDashboardItemEdit } from '../../dashboard-host';
import { resolveStoredDateRange } from '../../utils';

const defaultQuickDate = 'last_7_days';

function DayWiseWorklogGadget({ jiraContext }: DashboardItemProps) {
    const settings = getDashboardItemConfig<DateRangeGadgetSettings>(jiraContext);
    const reportSettings = useMemo(() => ({ dateRange: resolveStoredDateRange(settings.dateRange, defaultQuickDate) }), [settings.dateRange]);

    if (isDashboardItemEdit(jiraContext)) {
        return <DateRangeConfig hostType={getDashboardHostType(jiraContext)} settings={settings} defaultQuickDate={defaultQuickDate} />;
    }

    return (
        <div className="h-87.5 max-h-125 overflow-auto widget:h-full widget:max-h-none">
            <UserDateWiseWorklog settings={reportSettings} />
        </div>
    );
}

export default withInitParams(withSimpleAuth(DayWiseWorklogGadget));
