import { memo, useCallback } from 'react';

import JiraFieldMultiSelect from '@/jira-controls/JiraFieldMultiSelect';

import { Checkbox } from '@components';

const hideKeys = ['key', 'summary', 'worklog', 'issuekey'];

interface FieldsListSettingsProps {
    fields: any;
    setFieldValue: (value: any, field: string) => void;
    epicField?: string;
}

function FieldsListSettings({ setFieldValue, fields }: FieldsListSettingsProps) {
    const { optional, daywiseFields, showCostReport, hideEstimate } = fields || {};

    const setSelectedFields = useCallback(
        (sel: boolean, field: string) => {
            const dwFields = daywiseFields || {};
            if (sel) {
                setFieldValue({ ...dwFields, [field]: true }, 'daywiseFields');
            } else {
                const val = { ...dwFields };
                delete val[field];
                setFieldValue(val, 'daywiseFields');
            }
        },
        [daywiseFields, setFieldValue],
    );

    const hasOptionalFields = optional?.length > 0;

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap gap-x-8 gap-y-3">
                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={showCostReport}
                        onChange={(e) => setFieldValue(e.value, 'showCostReport')}
                        label="Show cost report"
                    />
                    <i
                        className="fa fa-exclamation-triangle text-amber-500 text-xs"
                        title="Change will take effect only after report is refreshed"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={hideEstimate}
                        onChange={(e) => setFieldValue(e.value, 'hideEstimate')}
                        label="Hide estimate related fields"
                    />
                    <i
                        className="fa fa-exclamation-triangle text-amber-500 text-xs"
                        title="Change will take effect only after report is refreshed"
                    />
                </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-semibold text-primary mb-2">Additional fields to pull from Jira</h4>
                <JiraFieldMultiSelect value={optional} field="optional" onChange={setFieldValue} hideKeys={hideKeys} />
                <p className="text-xs text-secondary mt-2">These fields would be displayed in Flat (Groupable) view.</p>
            </div>

            {hasOptionalFields && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="text-sm font-semibold text-primary mb-3">
                        Additional fields to display in Grouped - [User daywise] report
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {optional.map((f: any) => (
                            <Checkbox
                                key={f.id}
                                checked={daywiseFields?.[f.id]}
                                onChange={(e) => setSelectedFields(e.value, f.id)}
                                label={f.name}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default memo(FieldsListSettings);
