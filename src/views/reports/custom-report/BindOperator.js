import React, { PureComponent } from 'react';
import { SelectBox } from '../../../controls';
import { OPERATORS } from '../../../_constants';

class BindOperator extends PureComponent {
    constructor(props) {
        super(props);
        this.applFuncs = OPERATORS.filter((o) => !o.types || o.types.indexOf(this.row.type) > -1);
        if (!props.row.operator) {
            props.row.operator = this.applFuncs[0].value;
        }
    }

    render() {
        var {
            applFuncs,
            props: { row }
        } = this;

        return (
            <SelectBox dataset={applFuncs} value={row.operator} />
        );
    }
}

export default BindOperator;