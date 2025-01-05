import React, { useState, useEffect, useCallback } from 'react';
import QueryEditor from '../../../components/QueryEditor';
import { getSuggestions } from './query-processing/generate';

const testingQuery = `select iss.issuetype,iss.assignee,first(iss.issuekey)
from issues iss
left join issuesFromSprint(\${sprintList}, false) si on 1=1
left join worklogs w on w.issuekey = iss.issuekey
left join (select issuekey,type,value from changelogs cl where type in ("a","b")) sq on sq.issuekey=iss.issuekey 
where iss.reporter=currentUser() and iss.whereField = \${issuekey}
group by iss.groupField,iss.groupField2
order by iss.orderField,iss.orderField`;

function QueryBlock({ onExecute }) {
    const [query, setQuery] = useState(testingQuery);
    const [json, setJson] = useState(false);

    const handleChange = useCallback((newQuery, valid) => {
        setQuery(newQuery);
        setJson(valid);
    }, []);

    const handleExecute = useCallback(() => {
        if (!json) { return; }

        onExecute(json, query);
    }, [query, json]);

    const handleKeyDown = useCallback((e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            handleExecute();
        }
    }, [handleExecute]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <div className="query-report__editor-container">
            <QueryEditor
                value={query}
                onChange={handleChange}
                getSuggestions={getSuggestions}
            />
            <button
                className="query-report__execute-button"
                onClick={handleExecute}
                disabled={!query}
                title="Execute Query (Ctrl+Enter)"
            >
                <span className="fas fa-play" />
            </button>
        </div>
    );
}

export default QueryBlock;
