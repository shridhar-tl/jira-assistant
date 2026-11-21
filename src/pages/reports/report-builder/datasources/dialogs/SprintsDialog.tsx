import { useCallback, useState } from 'react';

import { Checkbox, NumericInput, RapidViewList, toSelectedBoards, type AgileBoard } from '@components';

import type { DatasourceConfigureRequest } from '@components/report-builder';
import type { RapidView } from '@components/shared/RapidViewList';

import { closeConfigureDialog } from '../configure-dialog-store';
import type { SourceMode } from '../sprint-resolution';
import { sprintStates, type SprintStateName, type SprintsDatasourceConfig } from '../sprints-plugin';

import ConfigureDialogShell from './ConfigureDialogShell';
import { getApplyLabel, getDialogTitle, getNameError } from './dialog-utils';
import DialogField from './DialogField';
import ExpressionInput from './ExpressionInput';
import SourceModeToggle from './SourceModeToggle';
import { useParameterHint } from './use-parameter-hint';

interface SprintsDialogProps {
    request: DatasourceConfigureRequest;
}

const boardExprId = 'ja-rb-board-expr';
const lastCountId = 'ja-rb-sprint-last';
const stateLabels: Record<SprintStateName, string> = { active: 'Active', closed: 'Closed', future: 'Future' };

export default function SprintsDialog({ request }: SprintsDialogProps) {
    const initial = request.datasource.config as unknown as SprintsDatasourceConfig;
    const [name, setName] = useState(request.datasource.name);
    const [mode, setMode] = useState<SourceMode>(initial.boardMode ?? 'fixed');
    const [boards, setBoards] = useState<AgileBoard[]>(initial.boards ?? []);
    const [boardExpression, setBoardExpression] = useState(initial.boardExpression ?? '');
    const [states, setStates] = useState<SprintStateName[]>(initial.states ?? ['active', 'closed']);
    const [lastCount, setLastCount] = useState<number | undefined>(initial.lastCount);
    const parameterHint = useParameterHint(request);

    const handleBoards = useCallback((value: RapidView | RapidView[] | null) => setBoards(toSelectedBoards(value)), []);
    const toggleState = (state: SprintStateName, checked: boolean) =>
        setStates((prev) => (checked ? [...prev.filter((s) => s !== state), state] : prev.filter((s) => s !== state)));

    const nameError = getNameError(name, request);
    const sourceError =
        mode === 'fixed'
            ? boards.length === 0
                ? 'Choose at least one board.'
                : null
            : boardExpression.trim()
              ? null
              : 'Enter the expression returning the boards.';
    const statesError = states.length === 0 ? 'Choose at least one sprint state.' : null;
    const canApply = !nameError && !sourceError && !statesError;

    const apply = () => {
        const config: SprintsDatasourceConfig = {
            boardMode: mode,
            boards: mode === 'fixed' ? boards : [],
            boardExpression: mode === 'expression' ? boardExpression.trim() : undefined,
            states,
            lastCount: lastCount && lastCount > 0 ? lastCount : undefined,
        };
        closeConfigureDialog({ name, config: config as unknown as Record<string, unknown> });
    };

    return (
        <ConfigureDialogShell
            title={getDialogTitle(request, 'sprints')}
            name={name}
            onNameChange={setName}
            canApply={canApply}
            applyLabel={getApplyLabel(request)}
            onApply={apply}
            onCancel={() => closeConfigureDialog(null)}
            error={nameError}
        >
            <DialogField label="Boards" error={sourceError}>
                <SourceModeToggle
                    value={mode}
                    onChange={setMode}
                    fixedLabel="Choose boards now"
                    expressionLabel="Use a parameter"
                    ariaLabel="How the boards are chosen"
                />
            </DialogField>
            {mode === 'fixed' ? (
                <RapidViewList value={boards} onChange={handleBoards} multiple placeholder="Select agile boards" />
            ) : (
                <DialogField
                    label="Boards expression"
                    htmlFor={boardExprId}
                    helpText={<>Returns boards or board ids, e.g. Parameters.boards. {parameterHint}</>}
                >
                    <ExpressionInput
                        id={boardExprId}
                        value={boardExpression}
                        onChange={setBoardExpression}
                        placeholder="Parameters.boards"
                    />
                </DialogField>
            )}
            <DialogField label="Sprint states" error={statesError}>
                <div className="flex flex-wrap gap-4">
                    {sprintStates.map((state) => (
                        <Checkbox
                            key={state}
                            label={stateLabels[state]}
                            checked={states.includes(state)}
                            onChange={(e) => toggleState(state, e.value)}
                        />
                    ))}
                </div>
            </DialogField>
            <DialogField
                label="Only the latest sprints of each board"
                htmlFor={lastCountId}
                helpText="Leave empty to include every sprint."
            >
                <NumericInput id={lastCountId} value={lastCount} min={0} onChange={(e) => setLastCount(e.value)} placeholder="All" />
            </DialogField>
        </ConfigureDialogShell>
    );
}
