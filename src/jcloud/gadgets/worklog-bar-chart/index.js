import React from 'react';
import { view } from '@forge/bridge';
import withInitParams from '../../../layouts/initialization';
import withAuthInfo from '../../../layouts/authorization/simple-auth';
import WorklogBarChart from '../../../components/shared/worklog-bar-chart';
import { DatePicker } from '../../../controls';

const Gadget = function ({ jiraContext: { extension: { gadgetConfiguration: settings, entryPoint } } }) {
    const isEdit = entryPoint === 'edit';

    if (isEdit) {
        const dateSelected = async (dateRange) => {
            if (dateRange.toDate && !dateRange.auto) {
                await view.submit({ ...settings, dateRange });
            }
        };

        return (<div style={{ height: '350px' }}>
            <label>Worklog Date range</label>
            <DatePicker range={true} value={settings.dateRange} onChange={dateSelected} style={{ marginRight: "35px" }} />
        </div>);
    } else {
        return <div style={{ height: '400px' }}><WorklogBarChart settings={settings} /></div>;
    }
};

export default withInitParams(withAuthInfo(Gadget));