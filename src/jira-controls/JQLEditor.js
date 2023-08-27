import React from 'react';
import { TextBox, Button } from 'src/controls';
import './Common.scss';

function JQLEditor({ jql, plugged, onChange }) {
    const [value, setValue] = React.useState(jql || '');
    React.useEffect(() => {
        setValue(jql || '');
    }, [jql]);

    const handleChange = React.useCallback((val) => setValue(val), [setValue]);

    const [isEdit, setEditMode] = React.useState(!plugged);
    const beginEdit = React.useCallback(() => setEditMode(true), [setEditMode]);
    const doneEdit = () => {
        onChange(value?.trim(), null);
        setValue(value?.trim());
        setEditMode(false);
    };
    const cancelEdit = () => {
        setValue(jql || '');
        setEditMode(false);
    };

    return (
        <div className={`jql-editor${plugged ? ' plugged' : ''}`}>
            {isEdit && <TextBox className="jql-query" multiline autoFocus
                placeholder="JQL query to fetch data"
                value={value} onChange={handleChange} />}
            {!isEdit && !!jql && <span className="jql-query-text" onClick={beginEdit}>{jql}</span>}
            {!isEdit && !jql && <span className="jql-query-text unavailable"
                onClick={beginEdit}>Provide JQL query text here</span>}
            {plugged && isEdit && <Button icon="fa fa-check" onClick={doneEdit} />}
            {plugged && isEdit && <Button icon="fa fa-times" onClick={cancelEdit} />}
        </div>
    );
}

export default JQLEditor;