import React, { PureComponent } from 'react';
import { ScrollableTable, TBody, THead } from '../../../components/ScrollableTable';
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

    render() {
        const { fields } = this.props;

        return (
            <ScrollableTable className="display-fields" dataset={fields}>
                <THead>
                    <tr>
                        <th>#</th>
                        <th>Display Column</th>
                        <th>Type</th>
                        <th>Remove</th>
                    </tr>
                </THead>
                <TBody>
                    {(f, i) => <DisplayField key={i} field={f} index={i} onRemove={this.removeField} />}
                </TBody>
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
        const { index, field, field: { name, type, isArray, knownObj } } = this.props;

        return (
            <tr>
                <td className="data-center">{index + 1}</td>
                <td>{name}</td>
                {(knownObj || type) && <td>{type} {!!isArray && "(multiple)"}</td>}
                {!knownObj && !type && <td>{JSON.stringify(field)}</td>}
                <td className="data-center"><span className="fa fa-times" onClick={this.remove} /></td>
            </tr>
        );
    }
}

export default DisplayFields;