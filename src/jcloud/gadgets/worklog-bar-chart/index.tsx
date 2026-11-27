import { useMemo } from 'react';

import WorklogBarChart from '@/components/shared/worklog-bar-chart';
import { withInitParams } from '@/layouts/initialization/index.plugin';

import withSimpleAuth from '../../../layouts/authorization/simple-auth';
import DateRangeConfig, { type DateRangeGadgetSettings } from '../../components/DateRangeConfig';
import { type DashboardItemProps, getDashboardHostType, getDashboardItemConfig, isDashboardItemEdit } from '../../dashboard-host';
import { resolveStoredDateRange } from '../../utils';

const defaultQuickDate = 'one_month';

function WorklogBarChartGadget({ jiraContext }: DashboardItemProps) {
    const settings = getDashboardItemConfig<DateRangeGadgetSettings>(jiraContext);
    const chartSettings = useMemo(() => ({ dateRange: resolveStoredDateRange(settings.dateRange, defaultQuickDate) }), [settings.dateRange]);

    if (isDashboardItemEdit(jiraContext)) {
        return <DateRangeConfig hostType={getDashboardHostType(jiraContext)} settings={settings} defaultQuickDate={defaultQuickDate} />;
    }

    return (
        <div className="h-100 widget:h-full">
            <WorklogBarChart settings={chartSettings} />
        </div>
    );
}

export default withInitParams(withSimpleAuth(WorklogBarChartGadget));
