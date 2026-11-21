import { useCallback, type ReactNode } from 'react';

import { useShallow } from 'zustand/react/shallow';

import JQLEditor from '@/jira-controls/JQLEditor';

import {
    Button,
    customSprintRange,
    Dropdown,
    getSelectedBoardIds,
    InputSwitch,
    isSameSprintSelection,
    RapidViewList,
    SelectButton,
    sprintRangeOptions,
    SprintSelector,
    toSelectedBoards,
    type SprintSelectionMap,
} from '@components';

import type { RapidView } from '@components/shared/RapidViewList';

import {
    updateDataSourceType,
    updateJQL,
    updateSprintBoards,
    updateSprintSelection,
    updateSprintsParameter,
    usePivotConfig,
} from '../../store/pivot-config';
import { jqlDataSource, sprintDataSource, type PivotDataSourceType } from '../../types';

interface DataSourceProps {
    onDone: () => void;
}

interface SourceFieldProps {
    label: string;
    helpText?: ReactNode;
    error?: string | null;
    children: ReactNode;
}

const minJqlLength = 5;

const dataSourceOptions = [
    { value: String(jqlDataSource), label: 'JQL query', icon: <i className="fa fa-code" /> },
    { value: String(sprintDataSource), label: 'Sprints', icon: <i className="fa fa-flag-checkered" /> },
];

const dataSourceHelpText: Record<PivotDataSourceType, string> = {
    [jqlDataSource]: 'Issues matching the JQL query are pulled from Jira.',
    [sprintDataSource]: 'Issues of the chosen sprints are pulled from Jira and can be further filtered using JQL.',
};

const boardRequiredMessage = 'Select at least one agile board to choose the sprints from.';
const sprintRequiredMessage = 'Choose the sprints to pull the issues from.';
const noBoardsMessage = 'No agile boards selected. Select one or more agile boards above to choose the sprints from.';
const sprintsOnRunHelpText = 'The agile boards and sprints are asked every time the report is generated, so that it can be used for any team.';
const defaultRangeHelpText = 'Sprints chosen by default for each agile board. It can be changed while generating the report.';
const jqlParametersHelpText = 'Use parameters(\'Name\') to ask for a value while generating the report.';

const defaultRangeOptions = sprintRangeOptions.filter(({ value }) => value !== customSprintRange);

function SourceField({ label, helpText, error, children }: SourceFieldProps) {
    return (
        <div className="flex w-full min-w-0 flex-col gap-1.5">
            <span className="text-sm font-semibold text-(--text-primary)">{label}</span>
            {children}
            {error && <span className="text-xs text-(--color-error)">{error}</span>}
            {!error && helpText && <span className="text-xs text-(--text-secondary)">{helpText}</span>}
        </div>
    );
}

export default function DataSource({ onDone }: DataSourceProps) {
    const { jql, dataSourceType, sprintBoards, sprintSelection, sprintsParameter } = usePivotConfig(
        useShallow(({ jql, dataSourceType, sprintBoards, sprintSelection, sprintsParameter }) => ({
            jql,
            dataSourceType,
            sprintBoards,
            sprintSelection,
            sprintsParameter,
        })),
    );

    const isSprintSource = dataSourceType === sprintDataSource;
    const hasSprintsSelected = getSelectedBoardIds(sprintSelection).length > 0;
    const isSourceValid = isSprintSource ? !!sprintsParameter || hasSprintsSelected : (jql?.trim().length || 0) >= minJqlLength;

    const handleBoardsChange = useCallback((value: RapidView | RapidView[] | null) => updateSprintBoards(toSelectedBoards(value)), []);

    const handleSprintChange = useCallback(
        (selection: SprintSelectionMap) => {
            if (!isSameSprintSelection(selection, sprintSelection)) {
                updateSprintSelection(selection);
            }
        },
        [sprintSelection],
    );

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4 sm:p-5">
            <p className="text-sm text-(--text-secondary)">
                Choose how the issues for this report are pulled from Jira. Use a JQL query directly, or pull the issues of one or more
                sprints and optionally refine them further using JQL.
            </p>

            <SourceField label="Pull issues using" helpText={dataSourceHelpText[dataSourceType]}>
                <SelectButton
                    items={dataSourceOptions}
                    value={String(dataSourceType)}
                    onChange={(e) => updateDataSourceType(Number(e.value) as PivotDataSourceType)}
                    variant="segmented"
                    fullWidth
                    required
                    ariaLabel="Pull issues using"
                />
            </SourceField>

            {isSprintSource && (
                <div className="flex flex-col gap-4 rounded-lg border border-(--border-primary) bg-(--bg-secondary) p-3 sm:p-4">
                    <SourceField label="Choose sprints while generating the report" helpText={sprintsOnRunHelpText}>
                        <InputSwitch
                            checked={!!sprintsParameter}
                            onChange={(e) => updateSprintsParameter(e.value ? { range: 0 } : undefined)}
                            onLabel="Yes"
                            offLabel="No"
                            ariaLabel="Choose sprints while generating the report"
                        />
                    </SourceField>

                    {sprintsParameter && (
                        <SourceField label="Default sprints" helpText={defaultRangeHelpText}>
                            <Dropdown
                                value={sprintsParameter.range}
                                options={defaultRangeOptions}
                                onChange={(e) => updateSprintsParameter({ range: Number(e.value) })}
                            />
                        </SourceField>
                    )}
                </div>
            )}

            {isSprintSource && !sprintsParameter && (
                <div className="flex flex-col gap-4 rounded-lg border border-(--border-primary) bg-(--bg-secondary) p-3 sm:p-4">
                    <SourceField
                        label="Agile boards"
                        error={sprintBoards.length ? null : boardRequiredMessage}
                        helpText="Sprints of these boards are listed for selection."
                    >
                        <RapidViewList value={sprintBoards} onChange={handleBoardsChange} multiple placeholder="Select agile boards" />
                    </SourceField>

                    <SourceField
                        label="Sprints"
                        error={sprintBoards.length && !hasSprintsSelected ? sprintRequiredMessage : null}
                        helpText="Choose a range of recent sprints or pick specific sprints of each board."
                    >
                        <div className="flex min-w-0">
                            <SprintSelector
                                boards={sprintBoards}
                                value={sprintSelection}
                                onChange={handleSprintChange}
                                emptyMessage={noBoardsMessage}
                            />
                        </div>
                    </SourceField>
                </div>
            )}

            <SourceField
                label={isSprintSource ? 'Additional JQL filter (optional)' : 'JQL query'}
                helpText={
                    <>
                        {isSprintSource
                            ? 'Filters the issues of the chosen sprints. e.g. issuetype in (Story, Bug) AND status != Rejected'
                            : 'e.g. project in parameters(\'Projects\') AND issuetype in (Story, Bug) ORDER BY created DESC'}
                        <br />
                        {jqlParametersHelpText}
                    </>
                }
            >
                <div className="w-full min-w-0">
                    <JQLEditor jql={jql} plugged onChange={updateJQL} />
                </div>
            </SourceField>

            <div className="flex border-t border-(--border-primary) pt-4 sm:justify-end">
                <Button
                    className="w-full justify-center sm:w-auto"
                    rightIcon={<span className="fa fa-arrow-right" />}
                    disabled={!isSourceValid}
                    onClick={onDone}
                    title="Configure the fields of the report"
                    label="Select fields"
                />
            </div>
        </div>
    );
}
