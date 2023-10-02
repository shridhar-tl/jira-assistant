import React from 'react';

export function ColumnHeader({ column, template: Template, scope, keyField, setCollapse }) {
    const toggle = React.useCallback(() => {
        setCollapse(keyField, true);
    }, [keyField, setCollapse]);

    return (<th className="column-th">
        <div className="header-container">
            <div className="column-header">
                <Template column={column} scope={scope} />
            </div>

            <div className="collapse-icon" onClick={toggle}>
                <span className="fa fa-angle-left" />
            </div>
        </div>
    </th>);
}

export function CollapsedColumnHeader({ setCollapse, keyField }) {
    const toggle = React.useCallback(() => {
        setCollapse(keyField);
    }, [keyField, setCollapse]);

    return (<td className="column-th-collapsed">
        <div className="header-container">
            <div className="collapse-icon" onClick={toggle} title="Click to expand this column">
                <span className="fa fa-angle-right" />
            </div>
        </div>
    </td>);
}
