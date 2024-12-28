import React from 'react';
import { Sortable } from '../../../../../../controls';
import { usePivotConfig } from '../../../store/pivot-config';
import { addField, setFields } from '../../../store/field-actions';
import RowConfigItem from './RowItem';
import ColConfigItem from './ColItem';
import './Config.scss';

function PivotConfig() {
    return (<div className="pivot-config">
        <FieldsConfig />
    </div>);
}

export default PivotConfig;

const accept = ['jira-field'];
const fieldPlaceholder = (<span className="p-3 d-block">Drag and drop required fields from list to be shown in report</span>);
function FieldsConfig() {
    const fields = usePivotConfig(({ fields }) => fields);

    return (<div className="fields-config">
        <strong>Report Fields</strong>
        <Sortable placeholder={fieldPlaceholder}
            useDragRef
            items={fields} accept={accept}
            defaultItemType="row-group"
            onDrop={addField} onChange={setFields}>
            {
                (item, index, { draggable }) => (
                    item.colGroup
                        ? (
                            <ColConfigItem key={index}
                                item={item} index={index}
                                dragProps={draggable} depth={0}
                                path={`fields.${index}`}
                            />
                        )
                        : (
                            <RowConfigItem key={index}
                                index={index} item={item} depth={0}
                                dragProps={draggable}
                            />
                        )
                )
            }
        </Sortable>
    </div>);
}
