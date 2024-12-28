import React, { PureComponent } from 'react';
import { Sortable } from '../../../controls';
import { ScrollableTable, THead } from '../../../components/ScrollableTable';
import CustomFieldSelector from '../../../jira-controls/CustomFieldSelector';
import { getField } from './Utils';
import { Checkbox, TextBox } from '../../../controls';
import Dialog from '../../../dialogs';

class DisplayFields extends PureComponent {
    state = { expression: '' };

    fieldAdded = (val, obj) => {
        const { fields, onChange } = this.props;
        onChange(fields.concat(getField(obj)));
    };

    removeField = (index) => {
        const { fields, onChange } = this.props;
        onChange(fields.filter((_, i) => i !== index));
    };

    headerChanged = (val, index) => {
        let { fields } = this.props;
        fields = [...fields];

        let field = fields[index];
        field = { ...field };
        fields[index] = field;

        field.header = val;
        this.props.onChange(fields);
    };

    editExpression = (index) => {
        let { fields } = this.props;
        let field = fields[index];
        const expression = field.expr || '';
        this.setState({ expression });

        Dialog.alert(<>
            <TextBox
                className="expr-editor"
                multiline={true}
                placeholder="Provide JavaScript expression (e.g. this.name or this - Fields.timespent + Fields.aggregatetimespent)"
                value={expression}
                onChange={val => this.setState({ expression: val })} />
            <span>
                Provide JavaScript expression to print a value.
                You can use "this" to refer to the current field
                and "Fields" variable to refer to the object containing all the fields.
            </span>
        </>, "Edit Expression", { width: "600px" })
            .then(() => {
                const { expression } = this.state;

                if ((expression || '') === (field.expr || '')) {
                    return;
                }

                field = { ...field };
                field.expr = this.state.expression;
                if (!field.expr) {
                    delete field.expr;
                }
                fields = [...fields];
                fields[index] = field;
                this.props.onChange(fields);
            });
    };

    toggleDisplay = (index, hide) => {
        let { fields } = this.props;
        fields = [...fields];
        fields[index] = { ...fields[index], hide };
        this.props.onChange(fields);
    };

    getControls = (f, i, { draggable: { dragRef }, droppable: { dropRef } }) => (<DisplayField key={i}
        dragHandle={dragRef}
        dropConnector={dropRef}
        field={f} index={i}
        onRemove={this.removeField}
        editExpression={this.editExpression}
        updateHeader={this.headerChanged}
        toggleDisplay={this.toggleDisplay}
    />);

    render() {
        const { fields, onChange } = this.props;

        return (
            <ScrollableTable className="display-fields">
                <THead>
                    <tr>
                        <th>#</th>
                        <th>Jira Field</th>
                        <th>Type</th>
                        <th>Hide</th>
                        <th>Header Text</th>
                        <th>Use Expr.</th>
                        <th>Remove</th>
                    </tr>
                </THead>
                <Sortable
                    useDragRef
                    useDropRef
                    tagName="tbody"
                    items={fields}
                    defaultItemType="field"
                    onChange={onChange}
                    itemTemplate={this.getControls} />
                <tfoot>
                    <tr>
                        <td className="data-center">{fields.length + 1}</td>
                        <td><CustomFieldSelector onChange={this.fieldAdded} /></td>
                        <td colSpan="5">Note: Select the column from the list to add it as output</td>
                    </tr>
                </tfoot>
            </ScrollableTable>
        );
    }
}

class DisplayField extends PureComponent {
    constructor(props) {
        super(props);
        this.state = { header: props.field.header };
    }

    UNSAFE_componentWillReceiveProps(props) {
        this.setState({ header: props.field.header });
    }

    remove = () => this.props.onRemove(this.props.index);
    editExpression = () => this.props.editExpression(this.props.index);
    toggleDisplay = (hide) => this.props.toggleDisplay(this.props.index, hide);
    updateHeader = () => {
        let { header } = this.state;
        header = header?.trim() || undefined;

        this.props.updateHeader(header, this.props.index);
    };

    headerChanged = (header) => this.setState({ header });

    render() {
        const {
            dragHandle, dropConnector,
            index, field, field: { name, field: fieldProp, type, isArray, knownObj, expr }
        } = this.props;
        const { header } = this.state;

        return (
            <tr ref={dropConnector}>
                <td className="data-center" ref={dragHandle}>{index + 1}</td>
                <td>{name} ({fieldProp})</td>
                {(knownObj || type) && <td>{type} {!!isArray && "(multiple)"}</td>}
                <td className="data-center">
                    <Checkbox checked={field.hide} onChange={this.toggleDisplay} title="Hide this field in display and use this property only from expression of other fields" />
                </td>
                <td>{field.hide ? "(not applicable)" : <TextBox
                    value={header}
                    placeholder={name}
                    onChange={this.headerChanged}
                    onBlur={this.updateHeader} />}</td>
                {!knownObj && !type && <td>{JSON.stringify(field)}</td>}
                {!field.hide && <td className="data-center">
                    {expr ?
                        <span className="fa fa-edit" onClick={this.editExpression} title="Click to edit the expression" />
                        : <Checkbox checked={false} onChange={this.editExpression} title="Click to add an expression" />}
                </td>}
                {!!field.hide && <td></td>}
                <td className="data-center"><span className="fa fa-times" onClick={this.remove} /></td>
            </tr>
        );
    }
}

export default DisplayFields;