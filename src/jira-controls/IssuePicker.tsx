import React, { useState, useEffect, useRef, useCallback } from 'react';

import { inject } from '@services';

import { Autocomplete } from '@components';

import { viewIssueUrl } from '@utils/helpers';

import type JiraService from '../services/jira-service';
import type SessionService from '../services/session-service';

const ignoredKeysStrokes = [9, 16, 17, 18, 27, 123];
const issueKeyTest = /^\b[A-Z][A-Z0-9_]+-[1-9][0-9]*$/gi;

interface IssueObject {
    id: string;
    key: string;
    root?: string;
    url?: string;
    summary: string;
    summaryText: string;
    img: string;
}

async function getIssueObject($jira: JiraService, $session: SessionService, key: string): Promise<IssueObject | undefined> {
    if (!new RegExp(issueKeyTest).test(key)) {
        return undefined;
    }

    const root = $session.CurrentUser.jiraUrl?.replace(/\/+$/, '');

    try {
        const [issue] = await $jira.searchTickets(`key=${key}`);
        const newObj: IssueObject = {
            id: issue.id,
            key: issue.key,
            root,
            url: viewIssueUrl(root || '', issue.key),
            summary: issue.fields.summary,
            summaryText: issue.fields.summary,
            img: issue.fields.issuetype.iconUrl,
        };

        return newObj;
    } catch (err) {
        console.error('Invalid issue key provided in picker', err);
        return undefined;
    }
}

interface IssuePickerProps {
    value?: string | IssueObject;
    disabled?: boolean;
    useDisplay?: boolean;
    returnObject?: boolean;
    onPick?: (issue: IssueObject | string | undefined) => void;
    onInvalid?: (key: string) => void;
    tabIndex?: number;
    className?: string;
    placeholder?: string;
    maxLength?: number;
}

interface IssueListItem {
    value: IssueObject;
    label: string;
    icon?: React.ReactElement;
}

export const IssuePicker: React.FC<IssuePickerProps> = React.memo(
    ({
        value,
        disabled,
        useDisplay,
        returnObject,
        onPick,
        onInvalid,
        tabIndex,
        className = '',
        placeholder = 'Enter issue key or summary',
    }) => {
        const timerRef = useRef<{ blurTimer?: ReturnType<typeof setTimeout> }>({});
        const [loading, setLoader] = useState(useDisplay && !!value);
        const [issueObj, setIssue] = useState<IssueObject | false>(
            useDisplay && value ? ({ key: typeof value === 'string' ? value : value.key } as IssueObject) : false,
        );
        const [editMode, toggleEdit] = useState(!value);
        const [suggestions, setSuggestions] = useState<IssueListItem[]>([]);
        const [searchLoading, setSearchLoading] = useState(false);
        const [inputValue, setInputValue] = useState('');

        const { $jira, $session } = inject('JiraService', 'SessionService');

        const updateIssue = useCallback(
            (issue: IssueObject | undefined, key?: string) => {
                setLoader(false);
                setSearchLoading(false);
                if (onPick && (issue || !onInvalid || !key)) {
                    onPick(returnObject ? issue : issue?.key);
                } else if (onInvalid && !issue && key) {
                    onInvalid(key);
                }

                if (!issue) {
                    setIssue(false);
                    toggleEdit(true);
                } else if (useDisplay) {
                    setIssue(issue);
                    toggleEdit(false);
                }
            },
            [onPick, onInvalid, returnObject, useDisplay],
        );

        useEffect(() => {
            if (useDisplay && value && (!issueObj || value !== (typeof value === 'string' ? (issueObj as IssueObject).key : value.key))) {
                (async function () {
                    const key = typeof value === 'string' ? value : value.key;
                    const issue = await getIssueObject($jira, $session, key);
                    updateIssue(issue);
                })();
            }
        }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

        const handleFilter = useCallback(
            async (query: string) => {
                if (!query || query.length < 2) {
                    setSuggestions([]);
                    return;
                }

                setSearchLoading(true);
                try {
                    const sections = await $jira.lookupIssues(query);
                    const items: IssueListItem[] = [];

                    sections.forEach((section: any) => {
                        if (section.issues) {
                            section.issues.forEach((issue: IssueObject) => {
                                items.push({
                                    value: issue,
                                    label: `${issue.key} — ${issue.summaryText}`,
                                    icon: issue.img ? <img src={issue.img} alt="" className="w-4 h-4" /> : undefined,
                                });
                            });
                        }
                    });

                    setSuggestions(items);
                } catch {
                    setSuggestions([]);
                } finally {
                    setSearchLoading(false);
                }
            },
            [$jira],
        );

        const onIssueSelected = useCallback(
            (e: any) => {
                if (timerRef.current.blurTimer) {
                    clearTimeout(timerRef.current.blurTimer);
                    delete timerRef.current.blurTimer;
                }

                const selected = e.value;
                if (selected && typeof selected === 'object' && selected.key) {
                    updateIssue(selected);
                    setSuggestions([]);
                    setTimeout(() => setInputValue(''), 0);
                }
            },
            [updateIssue],
        );

        const handleChange = useCallback((e: any) => {
            const newVal = e.value;
            if (typeof newVal === 'string') {
                setInputValue(newVal);
            }
        }, []);

        const handleBlur = useCallback(() => {
            const selKey = inputValue.trim();

            if (!selKey) {
                return;
            }

            timerRef.current.blurTimer = setTimeout(async () => {
                delete timerRef.current.blurTimer;
                setIssue({ key: selKey } as IssueObject);
                setLoader(true);
                const issue = await getIssueObject($jira, $session, selKey);
                updateIssue(issue, selKey);
            }, 600);
        }, [inputValue, $jira, $session, updateIssue]);

        const editTicket = useCallback((e: React.KeyboardEvent) => {
            if (ignoredKeysStrokes.includes(e.keyCode)) {
                return;
            }
            toggleEdit(true);
        }, []);

        if (loading && useDisplay && issueObj) {
            return (
                <div
                    className="flex items-center gap-2 px-3 py-2 border border-(--border-color) rounded-lg bg-(--bg-secondary)"
                    title="Please wait. Loading details..."
                >
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{(issueObj as IssueObject).key}</span>
                    <span className="text-secondary">-</span>
                    <div className="text-secondary truncate flex-1">Loading...</div>
                    <i className="fa fa-spin fa-spinner ml-auto text-secondary" />
                </div>
            );
        }

        if (editMode || !issueObj || !useDisplay) {
            return (
                <div onBlur={handleBlur}>
                    <Autocomplete
                        value={inputValue}
                        onChange={handleChange}
                        onSelect={onIssueSelected}
                        onFilter={handleFilter}
                        items={suggestions}
                        disabled={disabled}
                        placeholder={placeholder}
                        className={className}
                        loading={searchLoading}
                        autoFocus={!!useDisplay}
                        minLength={2}
                        debounceMs={300}
                    />
                </div>
            );
        }

        return (
            <div
                className={`flex items-center gap-2 px-3 py-2 border border-(--border-color) rounded-lg cursor-pointer transition-colors hover:bg-(--bg-hover) ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
                tabIndex={tabIndex}
                onClick={disabled ? undefined : () => toggleEdit(true)}
                onKeyDown={disabled ? undefined : editTicket}
                data-test-id="issue-key"
                data-issue-key={(issueObj as IssueObject).key}
            >
                {(issueObj as IssueObject).img && <img src={(issueObj as IssueObject).img} className="w-4 h-4" alt="" />}
                <span className="font-semibold text-blue-600 dark:text-blue-400">{(issueObj as IssueObject).key}</span>
                <span className="text-secondary">-</span>
                <div className="flex-1 text-primary truncate">{(issueObj as IssueObject).summaryText}</div>
                {!disabled && <i className="fa fa-pencil text-secondary" title="Click to edit issue" />}
            </div>
        );
    },
);

IssuePicker.displayName = 'IssuePicker';

export default IssuePicker;
