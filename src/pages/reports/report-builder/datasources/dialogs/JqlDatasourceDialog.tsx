import { useState } from 'react';

import { NumericInput, TextArea } from '@components';

import type { DatasourceConfigureRequest } from '@components/report-builder';

import { closeConfigureDialog } from '../configure-dialog-store';
import type { JqlDatasourceConfig } from '../jql-plugin';

import ConfigureDialogShell from './ConfigureDialogShell';
import { getApplyLabel, getDialogTitle, getFieldAliasError, getNameError, getTemplateError } from './dialog-utils';
import DialogField from './DialogField';
import IssueFieldsPicker from './IssueFieldsPicker';
import { useParameterHint } from './use-parameter-hint';

interface JqlDatasourceDialogProps {
    request: DatasourceConfigureRequest;
}

const jqlInputId = 'ja-rb-jql';
const maxResultsInputId = 'ja-rb-jql-max';

export default function JqlDatasourceDialog({ request }: JqlDatasourceDialogProps) {
    const initial = request.datasource.config as unknown as JqlDatasourceConfig;
    const [name, setName] = useState(request.datasource.name);
    const [jql, setJql] = useState(initial.jql ?? '');
    const [fields, setFields] = useState(initial.fields ?? []);
    const [maxResults, setMaxResults] = useState<number | undefined>(initial.maxResults);
    const parameterHint = useParameterHint(request);

    const nameError = getNameError(name, request);
    const fieldsError = fields.length === 0 ? 'Choose at least one field.' : getFieldAliasError(fields);
    const jqlError = jql.trim() ? getTemplateError(jql) : 'Enter the JQL query.';
    const maxResultsError = maxResults !== undefined && (!Number.isInteger(maxResults) || maxResults < 0) ? 'Enter a whole number of issues, or leave it empty.' : null;
    const canApply = !nameError && !fieldsError && !jqlError && !maxResultsError;

    const apply = () => {
        const config: JqlDatasourceConfig = { jql: jql.trim(), fields, maxResults: maxResults && maxResults > 0 ? maxResults : undefined };
        closeConfigureDialog({ name, config: config as unknown as Record<string, unknown> });
    };

    return (
        <ConfigureDialogShell
            title={getDialogTitle(request, 'Jira issues (JQL)')}
            name={name}
            onNameChange={setName}
            canApply={canApply}
            applyLabel={getApplyLabel(request)}
            onApply={apply}
            onCancel={() => closeConfigureDialog(null)}
            error={nameError}
        >
            <DialogField
                label="JQL query"
                htmlFor={jqlInputId}
                error={jqlError}
                helpText={
                    <>
                        Insert parameter values with {'{{ expression }}'}, e.g. project in ({'{{ Parameters.projects }}'}). {parameterHint}
                    </>
                }
            >
                <TextArea
                    id={jqlInputId}
                    value={jql}
                    onChange={(e) => setJql(e.value)}
                    rows={4}
                    placeholder="project = ABC AND statusCategory != Done ORDER BY priority DESC"
                />
            </DialogField>
            <DialogField label="Fields" error={fieldsError}>
                <IssueFieldsPicker value={fields} onChange={setFields} autoSelectDefaults={request.mode === 'create'} />
            </DialogField>
            <DialogField label="Maximum issues" htmlFor={maxResultsInputId} helpText="Leave empty to load every matching issue." error={maxResultsError}>
                <NumericInput
                    id={maxResultsInputId}
                    value={maxResults}
                    min={0}
                    onChange={(e) => setMaxResults(e.value)}
                    placeholder="All"
                />
            </DialogField>
        </ConfigureDialogShell>
    );
}
