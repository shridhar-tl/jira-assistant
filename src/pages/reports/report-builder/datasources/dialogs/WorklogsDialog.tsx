import { useEffect, useMemo, useState } from 'react';

import { inject } from '@services';

import { Multiselect, SelectButton, TextArea } from '@components';

import type { DatasourceConfigureRequest } from '@components/report-builder';

import { closeConfigureDialog } from '../configure-dialog-store';
import type { WorklogUserMode, WorklogsDatasourceConfig } from '../worklogs-plugin';

import ConfigureDialogShell from './ConfigureDialogShell';
import { getApplyLabel, getDialogTitle, getFieldAliasError, getNameError } from './dialog-utils';
import DialogField from './DialogField';
import ExpressionInput from './ExpressionInput';
import IssueFieldsPicker from './IssueFieldsPicker';
import { useParameterHint } from './use-parameter-hint';

interface WorklogsDialogProps {
    request: DatasourceConfigureRequest;
}

const userModeItems = [
    { value: 'me', label: 'Me' },
    { value: 'groups', label: 'User groups' },
    { value: 'expression', label: 'Parameter' },
    { value: 'any', label: 'Everyone' },
];

const fromId = 'ja-rb-wl-from';
const toId = 'ja-rb-wl-to';
const usersExprId = 'ja-rb-wl-users';
const jqlId = 'ja-rb-wl-jql';
const excludedIssueFields = ['worklog'];

export default function WorklogsDialog({ request }: WorklogsDialogProps) {
    const initial = request.datasource.config as unknown as WorklogsDatasourceConfig;
    const [name, setName] = useState(request.datasource.name);
    const [fromExpression, setFrom] = useState(initial.fromExpression ?? '');
    const [toExpression, setTo] = useState(initial.toExpression ?? '');
    const [userMode, setUserMode] = useState<WorklogUserMode>(initial.userMode ?? 'me');
    const [groupNames, setGroupNames] = useState<string[]>(initial.groupNames ?? []);
    const [userExpression, setUserExpression] = useState(initial.userExpression ?? '');
    const [jql, setJql] = useState(initial.jql ?? '');
    const [issueFields, setIssueFields] = useState(initial.issueFields ?? []);
    const [groupOptions, setGroupOptions] = useState<Array<{ value: string; label: string }> | null>(null);
    const parameterHint = useParameterHint(request);

    useEffect(() => {
        if (userMode !== 'groups' || groupOptions) return;
        const { $usergroup } = inject('UserGroupService');
        $usergroup.getUserGroups().then((groups: Array<{ name: string; users?: unknown[] }>) => {
            setGroupOptions(groups.map((g) => ({ value: g.name, label: `${g.name} (${g.users?.length ?? 0} users)` })));
        });
    }, [userMode]); // eslint-disable-line react-hooks/exhaustive-deps

    const dateHelp = useMemo(
        () => <>An expression returning a date, e.g. First(Parameters.period) or StartOf(&apos;week&apos;, Today()). {parameterHint}</>,
        [parameterHint],
    );

    const nameError = getNameError(name, request);
    const dateError = !fromExpression.trim() || !toExpression.trim() ? 'Enter both the start and end date expressions.' : null;
    const userError =
        userMode === 'groups' && groupNames.length === 0
            ? 'Choose at least one user group.'
            : userMode === 'expression' && !userExpression.trim()
              ? 'Enter the expression returning the users.'
              : null;
    const fieldsError = getFieldAliasError(issueFields);
    const canApply = !nameError && !dateError && !userError && !fieldsError;

    const apply = () => {
        const config: WorklogsDatasourceConfig = {
            fromExpression: fromExpression.trim(),
            toExpression: toExpression.trim(),
            userMode,
            groupNames: userMode === 'groups' ? groupNames : [],
            userExpression: userMode === 'expression' ? userExpression.trim() : undefined,
            jql: jql.trim() || undefined,
            issueFields,
        };
        closeConfigureDialog({ name, config: config as unknown as Record<string, unknown> });
    };

    return (
        <ConfigureDialogShell
            title={getDialogTitle(request, 'worklogs')}
            name={name}
            onNameChange={setName}
            canApply={canApply}
            applyLabel={getApplyLabel(request)}
            onApply={apply}
            onCancel={() => closeConfigureDialog(null)}
            error={nameError}
        >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DialogField label="From" htmlFor={fromId} error={dateError}>
                    <ExpressionInput id={fromId} value={fromExpression} onChange={setFrom} placeholder="StartOf('month', Today())" />
                </DialogField>
                <DialogField label="To" htmlFor={toId}>
                    <ExpressionInput id={toId} value={toExpression} onChange={setTo} placeholder="EndOf('month', Today())" />
                </DialogField>
            </div>
            <span className="-mt-3 text-xs text-(--text-secondary)">{dateHelp}</span>

            <DialogField label="Worklogs of" error={userError}>
                <SelectButton
                    items={userModeItems}
                    value={userMode}
                    onChange={(e) => setUserMode(e.value as WorklogUserMode)}
                    variant="segmented"
                    fullWidth
                    required
                    ariaLabel="Whose worklogs to include"
                />
            </DialogField>
            {userMode === 'groups' && (
                <Multiselect
                    options={groupOptions ?? []}
                    value={groupNames}
                    onChange={(e) => setGroupNames(e.value ?? [])}
                    placeholder={groupOptions ? 'Choose user groups' : 'Loading user groups…'}
                    loading={!groupOptions}
                    ariaLabel="User groups"
                />
            )}
            {userMode === 'expression' && (
                <DialogField label="Users expression" htmlFor={usersExprId} helpText="Returns users, e.g. Parameters.users, or GroupUsers(Parameters.team) for a User groups parameter.">
                    <ExpressionInput id={usersExprId} value={userExpression} onChange={setUserExpression} placeholder="GroupUsers(Parameters.team)" />
                </DialogField>
            )}

            <DialogField
                label="Additional JQL filter (optional)"
                htmlFor={jqlId}
                helpText={<>e.g. project = ABC. Supports {'{{ expression }}'} templates.</>}
            >
                <TextArea id={jqlId} value={jql} onChange={(e) => setJql(e.value)} rows={2} />
            </DialogField>

            <DialogField label="Issue fields to include on each worklog row (optional)" error={fieldsError}>
                <IssueFieldsPicker
                    value={issueFields}
                    onChange={setIssueFields}
                    excludeIds={excludedIssueFields}
                    autoSelectDefaults={request.mode === 'create'}
                />
            </DialogField>
        </ConfigureDialogShell>
    );
}
