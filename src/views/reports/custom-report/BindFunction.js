import React, { PureComponent } from 'react';
import { SelectBox } from '../../../controls';
import { defaultFunctions, functions } from './functions';

const emptyValueHolder = "~~";

class BindFunction extends PureComponent {
    constructor(props) {
        super(props);

        const { row } = props;

        const applFuncs = functions.filter((f) => {
            return (((f.types.indexOf(row.type) > -1 || f.types.indexOf("*") > -1)
                || (row.knownObj && f.types.indexOf("object") > -1))
                && (!row.isArray === !f.forArray))
                && f.types.indexOf(`!${row.type}`) === -1;
        }).map(f => { return { value: f.name || emptyValueHolder, label: f.text }; });

        this.state = { applFuncs };

        if (!row.functions) {
            const defFunc = defaultFunctions[row.type];
            if (defFunc || defFunc === '') {
                this.setFunction(defFunc);
            }
            else {
                this.setFunction((applFuncs.first() || {}).value);
            }
        }
        //if (row.functions && row.functions.name) {
        //  selectHtml.selectpicker("val", row.functions.id);
        //}
        //else if (applFuncs.length) {
        //  selectHtml.selectpicker("val", applFuncs[0].name);
        //  selectionChanged();
        //}
    }

    selectionChanged = (func) => {
        if (func === emptyValueHolder) {
            func = "";
        }

        this.setState(this.setFunction(func));
    }

    setFunction(funcId) {
        if (!funcId && funcId !== '') {
            return;
        }

        if (funcId === "" && !this.state.applFuncs.some(f => f.value === funcId)) {
            funcId = this.state.applFuncs.first().value;
        }

        let func = functions.first((f) => f.name === funcId);

        if (!func && funcId) {
            func = functions.first((f) => f.name.startsWith(`${funcId}?`));
        }

        if (!func) {
            console.error("Unknown function expression:", funcId);
            return;
        }

        const selFunction = funcId;
        const funcName = func.name.split("?")[0];
        const params = !func.params ? null : func.params.map((p) => { return p.value ? p.value : p.default; });

        this.props.onChange({ id: func.name, name: funcName, params: params, useArray: func.aggregate, header: func.header });
        return { selFunction };
    }

    render() {
        const { applFuncs } = this.state;
        const { row: { functions: { id } = {} } } = this.props;

        return <SelectBox dataset={applFuncs} value={id || emptyValueHolder} valueField="value" style={{ 'width': '100%' }} onChange={this.selectionChanged} />;
    }
}

export default BindFunction;