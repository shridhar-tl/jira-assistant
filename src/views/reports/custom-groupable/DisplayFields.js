import React, { PureComponent } from 'react';
import { Sortable } from 'jsd-report';
import { ScrollableTable, THead } from '../../../components/ScrollableTable';
import CustomFieldSelector from '../../../jira-controls/CustomFieldSelector';
import { getField } from './Utils';

class DisplayFields extends PureComponent {
    fieldAdded = (val, obj) => {
        const { fields, onChange } = this.props;
        onChange(fields.concat(getField(obj)));
    }

    removeField = (index) => {
        const { fields, onChange } = this.props;
        onChange(fields.filter((_, i) => i !== index));
    }

    getControls = (f, i, hndl, drag) => {
        return (<DisplayField key={i} dragHandle={drag.dragHandle} dropConnector={hndl.dropConnector} field={f} index={i} onRemove={this.removeField} />);
    }

    render() {
        const { fields, onChange } = this.props;

        return (
            <ScrollableTable className="display-fields">
                <THead>
                    <tr>
                        <th>#</th>
                        <th>Display Column</th>
                        <th>Type</th>
                        <th>Remove</th>
                    </tr>
                </THead>
                <Sortable items={fields} itemType="field" itemTarget="field"
                    onChange={onChange}
                    useDragHandle={true}
                    useCustomContainer={true}>
                    {(renderItems, dropProps) => (
                        <tbody>
                            {renderItems(this.getControls)}
                        </tbody>
                    )}
                </Sortable>
                <tfoot>
                    <tr>
                        <td className="data-center">{fields.length + 1}</td>
                        <td><CustomFieldSelector onChange={this.fieldAdded} /></td>
                        <td colSpan="2">Note: Select the column from the list to add it as output</td>
                    </tr>
                </tfoot>
            </ScrollableTable>
        );
    }
}

class DisplayField extends PureComponent {
    remove = () => this.props.onRemove(this.props.index);

    render() {
        const {
            dragHandle, dropConnector,
            index, field, field: { name, type, isArray, knownObj }
        } = this.props;

        return dropConnector(
            <tr>
                <td className="data-center" ref={dragHandle}>{index + 1}</td>
                <td>{name}</td>
                {(knownObj || type) && <td>{type} {!!isArray && "(multiple)"}</td>}
                {!knownObj && !type && <td>{JSON.stringify(field)}</td>}
                <td className="data-center"><span className="fa fa-times" onClick={this.remove} /></td>
            </tr>
        );
    }
}

export default DisplayFields;