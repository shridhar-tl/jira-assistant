import React from 'react';
import { FormCheckbox, FormSelectBox } from 'react-controls/controls/form';
import { canAllowDistinct, getFunctionsByType } from '../../../../utils/format-functions';

function DisplayOption({ item, isGrouped, isRow }) {
    if (isGrouped) {
        return null;
    }

    const functions = getFunctionsByType(item.schema?.type, isRow);
    const allowDistinct = canAllowDistinct(item.agrFunc);

    return (<div className="display-options">
        <div className="label-value-pair">
            <label>Aggregation:</label><span className="prop-value">
                <FormSelectBox field="agrFunc" dataset={functions} autoSelect />
            </span>
        </div>
        {allowDistinct && <div className="label-value-pair">
            <FormCheckbox field="useDistinct" label="Use distinct values only" disabled />
        </div>}
    </div>);
}

export default DisplayOption;
