import React from 'react';
import { FormCheckbox, FormSelectBox } from 'react-controls/controls/form';
import { canAllowDistinct, getFunctionsByType } from '../../../../utils/format-functions';
import { typeFormatMap } from './formatting';

function DisplayOption({ item, isGrouped, isRow }) {
    const functions = !isGrouped && getFunctionsByType(item.schema?.type, isRow);
    const allowDistinct = !isGrouped && canAllowDistinct(item.agrFunc);

    const formatting = typeFormatMap[item.schema?.type || ''];

    return (<div className="display-options">
        {functions && <div className="label-value-pair">
            <label>Function:</label><span className="prop-value">
                <FormSelectBox field="agrFunc" dataset={functions} autoSelect />
            </span>
        </div>}
        {allowDistinct && <div className="label-value-pair">
            <FormCheckbox field="useDistinct" label="Use distinct values only" disabled />
        </div>}

        {formatting && <div className="label-value-pair">
            <label>Formatting:</label><span className="prop-value">
                <FormSelectBox field="format" dataset={formatting} autoSelect />
            </span>
        </div>}
    </div>);
}

export default DisplayOption;
