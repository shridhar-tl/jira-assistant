import React from 'react';
import { useState } from 'react';
import { useEffect } from 'react';
import { useRef } from 'react';
import { AutoComplete, Image } from '../controls';
import { inject } from '../services/injector-service';
import './IssuePicker.scss';

const issueKeyTest = /^\b[A-Z][A-Z0-9_]+-[1-9][0-9]*$/gi;
async function getIssueObject($jira, key) {
    if (!new RegExp(issueKeyTest).test(key)) {
        return;
    }
    try {
        const [issue] = await $jira.searchTickets(`key=${key}`);
        const newObj = {
            id: issue.id,
            key: issue.key,
            summary: issue.fields.summary,
            summaryText: issue.fields.summary,
            img: issue.fields.issuetype.iconUrl
        };

        return newObj;
    } catch (err) {
        console.error('Invalid issue key provided in picker', err);
    }
}

export const IssuePicker = React.memo(function ({ value, disabled, useDisplay, returnObject, onPick, onInvalid, tabIndex, ...otherProps }) {
    const timerRef = useRef({});
    const [loading, setLoader] = useState(useDisplay && !!value);
    const [issueObj, setIssue] = useState(useDisplay && value ? { key: value } : false);
    const [editMode, toggleEdit] = useState(!value);

    const { $jira } = inject('JiraService');

    const updateIssue = (issue, key) => {
        setLoader(false);
        if (onPick && (issue || !onInvalid || !key)) { onPick(returnObject ? issue : issue?.key); }
        else if (onInvalid && !issue && key) { onInvalid(key); }

        if (!issue) {
            setIssue(false);
            toggleEdit(true);
        } else if (useDisplay) {
            setIssue(issue);
            toggleEdit(false);
        }
    };

    useEffect(() => {
        if (useDisplay && value && (!issueObj?.id || value !== issueObj.key)) {
            (async function () {
                const issue = await getIssueObject($jira, value);
                updateIssue(issue);
            })();
        }
    }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

    const onIssueSelected = (e) => {
        if (timerRef.current.blurTimer) {
            clearTimeout(timerRef.current.blurTimer);
            delete timerRef.current.blurTimer;
            updateIssue(e.value);
        }
    };

    const onBlur = (e) => {
        const input = e.target;
        const selKey = input.value;

        if (!selKey) {
            updateIssue('');
            return;
        }

        timerRef.current.blurTimer = setTimeout(async () => {
            delete timerRef.current.blurTimer;
            setIssue({ key: selKey });
            setLoader(true);
            const issue = await getIssueObject($jira, selKey);
            updateIssue(issue);
        }, 600);
    };

    const editTicket = () => toggleEdit(true);

    if (loading && useDisplay && issueObj) {
        return (<div className="sel-issue loading-data" title="Please wait. Loading details...">
            <span className="issue-key">{issueObj.key}</span> -
            <div className="issue-summary">Loading...</div>
            <span className="fa fa-spin fa-spinner" />
        </div>);
    }

    if (editMode || !issueObj || !useDisplay) {
        return (<AutoComplete value={value} displayField="value"
            dataset={$jira.lookupIssues} disabled={disabled} maxLength={20}
            onSelect={onIssueSelected} onBlur={onBlur} autoFocus optionGroupChildren="issues" optionGroupLabel="label"
            {...otherProps}>
            {(issue) => <span style={{ fontSize: 12, margin: '10px 10px 0 0' }}>
                <Image src={issue.img} alt="" className="margin-r-8" />{issue.key} - {issue.summaryText}</span>}
        </AutoComplete>);
    } else {
        return (<div className={`sel-issue${disabled ? ' disabled' : ''}`} tabIndex={tabIndex}
            onClick={disabled ? undefined : editTicket} onKeyDown={disabled ? undefined : editTicket}
            testId="ticket-key" data-issue-key={issueObj.key}>
            <Image src={issueObj.img} className="margin-r-8" />
            <span className="issue-key">{issueObj.key}</span> -
            <div className="issue-summary">{issueObj.summaryText}</div>
            {!disabled && <span className="edit-key fa fa-pencil" title="Click to edit issue" />}
        </div>);
    }
});