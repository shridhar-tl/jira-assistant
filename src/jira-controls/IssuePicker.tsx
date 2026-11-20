import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import { inject } from '@services';

import { Autocomplete, type ComponentEvent } from '@components';

import { viewIssueUrl } from '@utils/helpers';

import type BookmarkService from '../services/bookmark-service';
import type JiraService from '../services/jira-service';
import type SessionService from '../services/session-service';
import type TicketService from '../services/ticket-service';

const ignoredKeysStrokes = [9, 16, 17, 18, 27, 123];
const issueKeyTest = /^\b[A-Z][A-Z0-9_]+-[1-9][0-9]*$/gi;
const minSearchLength = 2;
const maxBookmarkSuggestions = 10;
const bookmarksGroupLabel = 'Bookmarks';

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

interface JiraIssueFields {
    summary?: string;
    issuetype?: { iconUrl?: string };
}

interface JiraIssue {
    id: string;
    key: string;
    fields?: JiraIssueFields;
}

interface PickerSection {
    label: string;
    issues?: IssueObject[];
}

async function loadBookmarkedIssues($bookmark: BookmarkService, $ticket: TicketService, $session: SessionService): Promise<IssueObject[]> {
    try {
        const keys = ((await $bookmark.getIssueKeys()) || []).filter((key) => new RegExp(issueKeyTest).test(key));
        if (!keys.length) {
            return [];
        }

        const issues: JiraIssue[] = (await $ticket.getTicketDetails(keys, true)) || [];
        const byKey = new Map(issues.map((issue) => [issue.key.toUpperCase(), issue]));
        const root = $session.CurrentUser.jiraUrl?.replace(/\/+$/, '') || '';

        return keys.reduce<IssueObject[]>((list, key) => {
            const issue = byKey.get(key.toUpperCase());
            if (issue) {
                const summary = issue.fields?.summary || '';
                list.push({
                    id: issue.id,
                    key: issue.key,
                    root,
                    url: viewIssueUrl(root, issue.key),
                    summary,
                    summaryText: summary,
                    img: issue.fields?.issuetype?.iconUrl || '',
                });
            }
            return list;
        }, []);
    } catch (err) {
        console.error('Unable to load bookmarked issues for picker', err);
        return [];
    }
}

function matchesQuery(issue: IssueObject, query: string): boolean {
    return issue.key.toLowerCase().includes(query) || (issue.summaryText || '').toLowerCase().includes(query);
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

interface IssueListGroup {
    label: string;
    items: IssueListItem[];
}

function toListItem(issue: IssueObject): IssueListItem {
    return {
        value: issue,
        label: `${issue.key} — ${issue.summaryText}`,
        icon: issue.img ? <img src={issue.img} alt="" className="w-4 h-4" /> : undefined,
    };
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
        const displayRef = useRef<HTMLDivElement>(null);
        const focusDisplayRef = useRef(false);
        const [loading, setLoader] = useState(useDisplay && !!value);
        const [issueObj, setIssue] = useState<IssueObject | false>(
            useDisplay && value ? ({ key: typeof value === 'string' ? value : value.key } as IssueObject) : false,
        );
        const [editMode, toggleEdit] = useState(!value);
        const [searchResults, setSearchResults] = useState<IssueListGroup[]>([]);
        const [bookmarks, setBookmarks] = useState<IssueObject[] | null>(null);
        const bookmarksRequestedRef = useRef(false);
        const [searchLoading, setSearchLoading] = useState(false);
        const [inputValue, setInputValue] = useState('');
        const inputValueRef = useRef('');

        const { $jira, $session, $bookmark, $ticket } = inject('JiraService', 'SessionService', 'BookmarkService', 'TicketService');

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

        useEffect(() => {
            const timers = timerRef.current;
            return () => clearTimeout(timers.blurTimer);
        }, []);

        const updateInputValue = useCallback((text: string) => {
            inputValueRef.current = text;
            setInputValue(text);
        }, []);

        const loadBookmarks = useCallback(() => {
            if (bookmarksRequestedRef.current) {
                return;
            }
            bookmarksRequestedRef.current = true;
            loadBookmarkedIssues($bookmark, $ticket, $session).then(setBookmarks);
        }, [$bookmark, $ticket, $session]);

        const handleFilter = useCallback(
            async (query: string) => {
                if (!query || query.length < minSearchLength) {
                    setSearchResults([]);
                    return;
                }

                setSearchLoading(true);
                try {
                    const sections: PickerSection[] = await $jira.lookupIssues(query);
                    setSearchResults(sections.map((section) => ({ label: section.label, items: (section.issues || []).map(toListItem) })));
                } catch {
                    setSearchResults([]);
                } finally {
                    setSearchLoading(false);
                }
            },
            [$jira],
        );

        const suggestionGroups = useMemo(() => {
            const query = inputValue.trim().toLowerCase();
            const bookmarkItems = (bookmarks || [])
                .filter((issue) => !query || matchesQuery(issue, query))
                .slice(0, maxBookmarkSuggestions)
                .map(toListItem);
            const bookmarkKeys = new Set(bookmarkItems.map((item) => item.value.key));

            const jiraGroups =
                query.length >= minSearchLength
                    ? searchResults.map((group) => ({
                          ...group,
                          items: group.items.filter((item) => !bookmarkKeys.has(item.value.key)),
                      }))
                    : [];

            return [{ label: bookmarksGroupLabel, items: bookmarkItems }, ...jiraGroups].filter((group) => group.items.length > 0);
        }, [bookmarks, searchResults, inputValue]);

        const onIssueSelected = useCallback(
            (e: ComponentEvent<IssueObject | string | undefined>) => {
                if (timerRef.current.blurTimer) {
                    clearTimeout(timerRef.current.blurTimer);
                    delete timerRef.current.blurTimer;
                }

                const selected = e.value;
                if (selected && typeof selected === 'object' && selected.key) {
                    focusDisplayRef.current = !!useDisplay;
                    updateIssue(selected);
                    setSearchResults([]);
                    updateInputValue('');
                }
            },
            [updateIssue, updateInputValue, useDisplay],
        );

        const handleChange = useCallback(
            (e: ComponentEvent<string>) => {
                const newVal = e.value;
                if (typeof newVal === 'string') {
                    updateInputValue(newVal);
                }
            },
            [updateInputValue],
        );

        const handleBlur = useCallback(() => {
            const selKey = inputValueRef.current.trim();

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
        }, [$jira, $session, updateIssue]);

        const isDisplayMode = !editMode && !!issueObj && !!useDisplay && !loading;

        useEffect(() => {
            if (isDisplayMode && focusDisplayRef.current) {
                focusDisplayRef.current = false;
                displayRef.current?.focus();
            }
        }, [isDisplayMode]);

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
                <div onBlur={handleBlur} onFocus={loadBookmarks}>
                    <Autocomplete
                        value={inputValue}
                        onChange={handleChange}
                        onSelect={onIssueSelected}
                        onFilter={handleFilter}
                        items={suggestionGroups}
                        openOnFocus
                        disabled={disabled}
                        placeholder={placeholder}
                        className={className}
                        loading={searchLoading}
                        autoFocus={!!useDisplay}
                        minLength={minSearchLength}
                        debounceMs={300}
                    />
                </div>
            );
        }

        return (
            <div
                className={`flex items-center gap-2 px-3 py-2 border border-(--border-color) rounded-lg cursor-pointer transition-colors hover:bg-(--bg-hover) ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
                ref={displayRef}
                tabIndex={disabled ? -1 : (tabIndex ?? 0)}
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
