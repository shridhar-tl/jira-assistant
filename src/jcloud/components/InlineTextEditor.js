import React, { useState, useEffect } from 'react';

function InlineTextEditor({ value, placeholder, className, altClassName, onChange }) {
    const [isEdit, setEditMode] = useState(false);
    const [valueEdited, setValue] = useState(value || '');

    useEffect(() => { setValue(value || ''); }, [value, setValue]);

    if (isEdit) {
        const endEdit = () => {
            setEditMode(false);
            onChange(valueEdited);
        };

        const onValueChange = (e) => setValue(e.currentTarget.value);
        const keyDown = (e) => {
            if (e.keyCode === 13) {
                endEdit();
            }
        };

        return (<input type="text" ref={c => c?.focus()} value={valueEdited}
            onKeyDown={keyDown} onChange={onValueChange} onBlur={endEdit} />);
    } else if (value) {
        return (<span className={className} onClick={setEditMode}>{value}</span>);
    } else {
        return (<span className={altClassName} onClick={setEditMode}>{placeholder || '<< no value >>'}</span>);
    }
}

export default InlineTextEditor;