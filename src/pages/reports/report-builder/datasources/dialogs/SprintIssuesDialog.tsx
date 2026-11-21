import { useCallback, useState } from 'react';

import {
    getSelectedBoardIds,
    isSameSprintSelection,
    RapidViewList,
    SprintSelector,
    TextArea,
    toSelectedBoards,
    type AgileBoard,
    type SprintSelectionMap,
} from '@components';

import type { DatasourceConfigureRequest } from '@components/report-builder';
import type { RapidView } from '@components/shared/RapidViewList';

import { closeConfigureDialog } from '../configure-dialog-store';
import type { SprintIssuesDatasourceConfig } from '../sprint-issues-plugin';
import type { SourceMode } from '../sprint-resolution';

import ConfigureDialogShell from './ConfigureDialogShell';
import { getApplyLabel, getDialogTitle, getFieldAliasError, getNameError } from './dialog-utils';
import DialogField from './DialogField';
import ExpressionInput from './ExpressionInput';
import IssueFieldsPicker from './IssueFieldsPicker';
import SourceModeToggle from './SourceModeToggle';
import { useParameterHint } from './use-parameter-hint';

interface SprintIssuesDialogProps {
    request: DatasourceConfigureRequest;
}

const sprintExprId = 'ja-rb-sprint-expr';
const jqlId = 'ja-rb-sprint-jql';

export default function SprintIssuesDialog({ request }: SprintIssuesDialogProps) {
    const initial = request.datasource.config as unknown as SprintIssuesDatasourceConfig;
    const [name, setName] = useState(request.datasource.name);
    const [mode, setMode] = useState<SourceMode>(initial.sprintMode ?? 'fixed');
    const [boards, setBoards] = useState<AgileBoard[]>(initial.boards ?? []);
    const [selection, setSelection] = useState<SprintSelectionMap>(initial.sprintSelection ?? {});
    const [sprintExpression, setSprintExpression] = useState(initial.sprintExpression ?? '');
    const [jql, setJql] = useState(initial.jql ?? '');
    const [fields, setFields] = useState(initial.fields ?? []);
    const parameterHint = useParameterHint(request);

    const handleBoards = useCallback((value: RapidView | RapidView[] | null) => setBoards(toSelectedBoards(value)), []);
    const handleSelection = useCallback((next: SprintSelectionMap) => {
        setSelection((prev) => (isSameSprintSelection(next, prev) ? prev : next));
    }, []);

    const nameError = getNameError(name, request);
    const sourceError =
        mode === 'fixed'
            ? getSelectedBoardIds(selection).length === 0
                ? 'Choose the boards and sprints.'
                : null
            : sprintExpression.trim()
              ? null
              : 'Enter the expression returning the sprints.';
    const fieldsError = fields.length === 0 ? 'Choose at least one field.' : getFieldAliasError(fields);
    const canApply = !nameError && !sourceError && !fieldsError;

    const apply = () => {
        const config: SprintIssuesDatasourceConfig = {
            sprintMode: mode,
            boards: mode === 'fixed' ? boards : [],
            sprintSelection: mode === 'fixed' ? selection : {},
            sprintExpression: mode === 'expression' ? sprintExpression.trim() : undefined,
            jql: jql.trim() || undefined,
            fields,
        };
        closeConfigureDialog({ name, config: config as unknown as Record<string, unknown> });
    };

    return (
        <ConfigureDialogShell
            title={getDialogTitle(request, 'sprint issues')}
            name={name}
            onNameChange={setName}
            canApply={canApply}
            applyLabel={getApplyLabel(request)}
            onApply={apply}
            onCancel={() => closeConfigureDialog(null)}
            error={nameError}
        >
            <DialogField label="Sprints" error={sourceError}>
                <SourceModeToggle
                    value={mode}
                    onChange={setMode}
                    fixedLabel="Choose sprints now"
                    expressionLabel="Use a parameter"
                    ariaLabel="How the sprints are chosen"
                />
            </DialogField>
            {mode === 'fixed' ? (
                <div className="flex flex-col gap-4 rounded-lg border border-(--border-primary) bg-(--bg-secondary) p-3 sm:p-4">
                    <DialogField label="Agile boards">
                        <RapidViewList value={boards} onChange={handleBoards} multiple placeholder="Select agile boards" />
                    </DialogField>
                    <DialogField
                        label="Sprints of the boards"
                        helpText="Choose a range of recent sprints or pick specific sprints. A range such as the last 3 sprints moves forward automatically."
                    >
                        <div className="flex min-w-0">
                            <SprintSelector
                                boards={boards}
                                value={selection}
                                onChange={handleSelection}
                                emptyMessage="Select one or more agile boards above."
                            />
                        </div>
                    </DialogField>
                </div>
            ) : (
                <DialogField
                    label="Sprints expression"
                    htmlFor={sprintExprId}
                    helpText={
                        <>Returns sprints, sprint ids or the value of a Sprints parameter, e.g. Parameters.sprints. {parameterHint}</>
                    }
                >
                    <ExpressionInput
                        id={sprintExprId}
                        value={sprintExpression}
                        onChange={setSprintExpression}
                        placeholder="Parameters.sprints"
                    />
                </DialogField>
            )}
            <DialogField
                label="Additional JQL filter (optional)"
                htmlFor={jqlId}
                helpText={<>e.g. issuetype in (Story, Bug). Supports {'{{ expression }}'} templates.</>}
            >
                <TextArea id={jqlId} value={jql} onChange={(e) => setJql(e.value)} rows={2} />
            </DialogField>
            <DialogField label="Fields" error={fieldsError}>
                <IssueFieldsPicker value={fields} onChange={setFields} autoSelectDefaults={request.mode === 'create'} />
            </DialogField>
        </ConfigureDialogShell>
    );
}
