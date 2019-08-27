import React, { PureComponent } from 'react';
import { SelectBox } from '../../../controls';
import { defaultFunctions, functions } from './functions';

class BindFunction extends PureComponent {
    ngOnChanges(change) {
        if (change.row && change.row.currentValue) {
            this.applFuncs = functions.filter((f) => {
                return (((f.types.indexOf(this.row.type) > -1 || f.types.indexOf("*") > -1)
                    || (this.row.knownObj && f.types.indexOf("object") > -1))
                    && (!this.row.isArray === !f.forArray))
                    && f.types.indexOf(`!${this.row.type}`) === -1;
            }).map(f => { return { value: f.name, label: f.text }; });
            if (this.row.functions) {
                this.selFunction = this.row.functions.id;
            }
            else {
                const defFunc = defaultFunctions[this.row.type];
                if (defFunc || defFunc === '') {
                    this.setFunction(defFunc);
                }
                else {
                    this.setFunction((this.applFuncs.first() || {}).name);
                }
            }
            //if (this.row.functions && this.row.functions.name) {
            //  selectHtml.selectpicker("val", this.row.functions.id);
            //}
            //else if (applFuncs.length) {
            //  selectHtml.selectpicker("val", applFuncs[0].name);
            //  selectionChanged();
            //}
        }
    }
    selectionChanged(func) {
        this.setFunction(func);
    }
    setFunction(funcId) {
        if (!funcId && funcId !== '') {
            return;
        }
        const func = functions.first((f) => f.name === funcId);
        if (!func) {
            functions.first((f) => f.name.startsWith(`${funcId}?`));
        }
        if (!func) {
            console.error("Unknown function expression:", funcId);
            return;
        }
        this.selFunction = funcId;
        const funcName = func.name.split("?")[0];
        const params = !func.params ? null : func.params.map((p) => { return p.value ? p.value : p.default; });
        this.row.functions = { id: func.name, name: funcName, params: params, useArray: func.aggregate, header: func.header };
    }

    render() {
        return (<SelectBox dataset="applFuncs" value="selFunction" style={{ 'width': '100%' }} onChange={this.selectionChanged} />

        );
    }
}

BindFunction.propTypes = {

};

export default BindFunction;