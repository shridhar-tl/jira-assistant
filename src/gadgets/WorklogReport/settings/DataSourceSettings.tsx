import { memo, useState } from 'react';

import RapidViewList from '../../../components/shared/RapidViewList';

import { ShowMoreLink } from './Common';

const msgProjTimeFrame = 'Not applicable when timeframe is Sprint or when no default project is configured';

interface DataSourceSettingsProps {
    state: any;
    setValue: (key: string, value: any) => void;
    setBoards: (boards: any[]) => void;
}

function DataSourceSettings({ setValue, setBoards, state }: DataSourceSettingsProps) {
    const { userListMode, timeframeType, sprintBoards, projects } = state;

    const disableProjects = timeframeType === '1' || !projects?.length;

    return (
        <div className="space-y-6">
            <RadioGroup
                label="User List"
                field="userListMode"
                value={userListMode}
                setValue={setValue}
                options={[
                    { value: '1', label: 'Show all users who logged work' },
                    { value: '2', label: 'Show only selected users' },
                    {
                        value: '3',
                        label: 'Show all users logged work on configured projects',
                        disabled: disableProjects,
                        warning: disableProjects ? msgProjTimeFrame : undefined,
                    },
                    {
                        value: '4',
                        label: 'Show selected users and all worklogs on configured projects',
                        disabled: disableProjects,
                        warning: disableProjects ? msgProjTimeFrame : undefined,
                    },
                ]}
            />

            <RadioGroup
                label="Time frame type"
                field="timeframeType"
                value={timeframeType}
                setValue={setValue}
                options={[
                    {
                        value: '1',
                        label: 'Based on specific sprint',
                        disabled: userListMode === '3' || userListMode === '4',
                        warning:
                            userListMode === '3' || userListMode === '4' ? 'Not applicable based on User List selection above' : undefined,
                    },
                    { value: '2', label: 'Based on selected date range' },
                ]}
            />

            {timeframeType === '1' && <SprintListSection sprintBoards={sprintBoards} setBoards={setBoards} />}
            {timeframeType === '1' && <SprintAdditionalOptions state={state} setValue={setValue} />}
            {timeframeType === '2' && <ReportGrouping state={state} setValue={setValue} userListMode={userListMode} />}
        </div>
    );
}

export default DataSourceSettings;

interface RadioOption {
    value: string;
    label: string;
    disabled?: boolean;
    warning?: string;
}

interface RadioGroupProps {
    label: string;
    field: string;
    value: string;
    setValue: (key: string, value: any) => void;
    options: RadioOption[];
}

function RadioGroup({ label, field, value, setValue, options }: RadioGroupProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <label className="text-sm font-medium text-primary sm:w-48 shrink-0 pt-1">{label}</label>
            <div className="space-y-1.5 flex-1">
                {options.map((opt) => (
                    <label key={opt.value} className={`flex items-center gap-2 text-sm cursor-pointer ${opt.disabled ? 'opacity-50' : ''}`}>
                        <input
                            type="radio"
                            name={field}
                            checked={value === opt.value}
                            onChange={() => setValue(field, opt.value)}
                            disabled={opt.disabled}
                            className="accent-blue-600"
                        />
                        <span>{opt.label}</span>
                        {opt.warning && <i className="fa fa-exclamation-triangle text-amber-500 text-xs" title={opt.warning} />}
                    </label>
                ))}
            </div>
        </div>
    );
}

const SprintListSection = memo(function SprintListSection({
    setBoards,
    sprintBoards,
}: {
    setBoards: (boards: any[]) => void;
    sprintBoards: any[];
}) {
    return (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <label className="text-sm font-medium text-primary sm:w-48 shrink-0 pt-1">Choose Agile board *</label>
            <div className="flex-1">
                <RapidViewList value={sprintBoards} onChange={setBoards as any} multiple={true} />
            </div>
        </div>
    );
});

function ReportGrouping({
    setValue,
    state: { epicField, reportUserGrp, jql },
    userListMode,
}: {
    setValue: (key: string, value: any) => void;
    state: any;
    userListMode: string;
}) {
    return (
        <>
            <RadioGroup
                label="Users worklog grouping"
                field="reportUserGrp"
                value={reportUserGrp}
                setValue={setValue}
                options={[
                    { value: '1', label: userListMode === '2' ? 'Use default user groups' : 'Do not group worklogs' },
                    { value: '2', label: 'Group worklogs based on project' },
                    { value: '3', label: 'Group worklogs based on Issue type' },
                    {
                        value: '4',
                        label: 'Group by Epic',
                        disabled: !epicField,
                        warning: !epicField
                            ? 'JIRA Epic field name must be configured in general settings → default values tab'
                            : undefined,
                    },
                ]}
            />
            {userListMode === '1' && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                    <i className="fa fa-exclamation-triangle mr-2" />
                    <strong>Caution:</strong> Pulling worklogs of all users on a specific time range could cause performance issues.
                    {jql ? ' Ensure you have necessary filters in JQL.' : ' Use JQL to add additional filters as necessary.'}
                </div>
            )}
        </>
    );
}

const SprintAdditionalOptions = memo(function SprintAdditionalOptions({
    setValue,
    state: { sprintStartRounding, sprintEndRounding },
}: {
    setValue: (key: string, value: any) => void;
    state: any;
}) {
    const [showMore, setShowMore] = useState(false);

    return (
        <>
            <ShowMoreLink showMore={showMore} setShowMore={setShowMore} />
            {showMore && (
                <>
                    <RadioGroup
                        label="Sprint start date rounding"
                        field="sprintStartRounding"
                        value={sprintStartRounding}
                        setValue={setValue}
                        options={[
                            { value: '1', label: 'Match exact start date time of sprint' },
                            { value: '2', label: 'Consider start of day as start date' },
                            { value: '3', label: 'Consider start of next day as start date' },
                            { value: '4', label: 'Use end of previous sprint (if available)' },
                        ]}
                    />
                    <RadioGroup
                        label="Sprint end date rounding"
                        field="sprintEndRounding"
                        value={sprintEndRounding}
                        setValue={setValue}
                        options={[
                            { value: '1', label: 'Match exact end date time of sprint' },
                            { value: '2', label: 'Consider end of day as end date' },
                            { value: '3', label: 'Consider end of previous day as end date' },
                            { value: '4', label: 'Use start of next sprint (if available)' },
                        ]}
                    />
                </>
            )}
        </>
    );
});
