import React, { useCallback, useState } from 'react';
import { Tooltip } from 'primereact/tooltip';
import { Sidebar } from 'primereact/sidebar';
import Image from '../../controls/Image';
import { connect } from './store';
import { addNewIssue, selectIssue, removeIssue, hideSettings, saveSettings } from './actions';
import { IssuePicker } from '../../jira-controls/IssuePicker';
import { Dialog } from '../../dialogs/CommonDialog';
import { Checkbox, SelectBox } from '../../controls';
import { maxScores } from './constants';
import './IssueCollection.scss';
import Link from '../../controls/Link';

function IssueCollection({ showConfigs, currentIssueId,
    viewingIssueId, issues, isModerator,
    hideSettings }) {
    return (<Sidebar className="config-settings" visible={showConfigs} onHide={hideSettings} modal={false} dismissable={false}>
        <h3>Issues List</h3>
        <div className='issues-collection'>
            <div className="list-header">Issues List</div>
            <Tooltip className="help-tooltip" target=".issue-list .issue" />
            <div className="issue-list">
                {(!issues || !issues.length) && <div className="empty-list">No issues added</div>}
                {issues.map(issue => <IssueComponent key={issue.id} issue={issue}
                    selected={viewingIssueId === issue.id}
                    estimating={currentIssueId === issue.id}
                />)}
            </div>
            {isModerator && <AddIssueComponent />}
        </div>
        {isModerator && <Settings />}
    </Sidebar>);
}

const Settings = connect(function ({ autoReveal, showHalfScore, maxPoints, scoreType, saveSettings }) {
    return (<>
        <h3>Settings</h3>
        <div className="poker-settings">
            {scoreType < 3 && <div><Checkbox checked={showHalfScore} field="showHalfScore" label="Show 0.5 story point" onChange={saveSettings} /></div>}
            <div><Checkbox checked={autoReveal} field="autoReveal" label="Auto reveal after voting" onChange={saveSettings} /></div>
            {scoreType < 3 && <div>
                <label>Max score</label>
                <SelectBox value={maxPoints} field="maxPoints" dataset={maxScores[scoreType]} onChange={saveSettings} />
            </div>}
        </div>
    </>);
}, ({ autoReveal, scoreType, showHalfScore, maxPoints }) =>
    ({ autoReveal, scoreType, showHalfScore, maxPoints }),
    { saveSettings });

function Issue({
    issue: { id, key, icon, url, summary },
    selected, estimating, selectIssue, removeIssue
}) {
    const remove = useCallback((e) => {
        stop(e);
        Dialog.confirmDelete(`Are you sure to delete "${key}"?`,
            "Delete issue")
            .then(() => removeIssue(id));
    }, [key, id, removeIssue]);

    return (
        <div className={`issue${selected ? ' selected' : ''}`} onClick={() => selectIssue(id)}
            data-pr-tooltip={summary}>
            {!estimating && selected && <span className="fa fa-arrow-right icon-sel-ind" />}
            {estimating && <span className="fa fa-clock-o icon-sel-ind" />}
            <span className="fa fa-times" onClick={remove} />
            <span className="issue-info">
                <Image src={icon} />
                <span className="key"> {key} </span>
                <Link href={url}>
                    <span className="fa fa-external-link" />
                </Link>
            </span>
        </div>
    );
}

function stop(e) { e.stopPropagation(); }

function AddNewIssue({ addNewIssue }) {
    const [isEditMode, setIsEditMode] = useState(false);

    const toggleMode = useCallback(() => setIsEditMode(!isEditMode), [isEditMode]);
    const addIssue = useCallback(({ value } = {}) => {
        if (!value) { return; }
        addNewIssue(value);
        setIsEditMode(false);
    }, [addNewIssue, setIsEditMode]);

    if (isEditMode) {
        return (<div className="add-key">
            <span onClick={toggleMode} className="fa fa-times" />
            <IssuePicker value="" className="issue-picker" onSelect={addIssue} />
        </div>);
    } else {
        return (<div className="add-issue" onClick={toggleMode}>
            <span className="fa fa-plus" /> Add new issue</div>);
    }
}

const IssueComponent = connect(Issue, null, { selectIssue, removeIssue });

const AddIssueComponent = connect(AddNewIssue,
    ({ hasExtensionSupport }) => ({ hasExtensionSupport }),
    { addNewIssue }, []);

export default connect(React.memo(IssueCollection),
    ({ issues, sid, moderatorId, currentIssueId, viewingIssueId, showConfigs }) =>
        ({ issues, currentIssueId, viewingIssueId, showConfigs, isModerator: sid === moderatorId }),
    { hideSettings });