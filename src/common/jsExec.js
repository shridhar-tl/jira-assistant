import exec from 'static-eval';
import { parse } from 'espree';

const parserOptions = {
    ecmaVersion: 10, sourceType: "script", ecmaFeatures: {
        jsx: false,
        globalReturn: false,
        impliedStrict: true
    }
};

export default function compileExpression(expression, props, { array, getObjVal, sandbox: exclude }) {
    if (props?.$this) {
        expression = `(function () { return ${expression};}).call(_$this_)`;
    }

    const env = {};

    if (props?.$this) {
        env._$this_ = props?.$this;
    }

    const ast = parse(expression, parserOptions)?.body[0];

    const valueFunc = function () {
        return exec(ast, env);
    };

    const isNoWrap = props?.noWrap === true;
    let wrapFunction = null;
    if (!isNoWrap) {

        wrapFunction = function (Fields, RowGroup, ColGroup, Variables) {
            env.Fields = Fields;
            env.RowGroup = RowGroup;
            env.ColGroup = ColGroup;
            env.Variables = Variables;

            env.Field = function (key) {
                return getObjVal(Fields, key);
            };

            return valueFunc();
        };
    }

    let funcToReturn = function (CommonFunctions, MyFunctions, Parameters, Datasets, array, getObjVal, ReportState, setReportState) {
        env.CommonFunctions = CommonFunctions;
        env.MyFunctions = MyFunctions;
        env.Parameters = Parameters;
        env.Datasets = Datasets;
        env.array = array;
        env.getObjVal = getObjVal;
        env.ReportState = ReportState;
        env.setReportState = setReportState;

        if (isNoWrap) {
            return valueFunc();
        }
        else {
            return wrapFunction;
        }
    };

    if (props) {
        const { commonFunctions, myFunctions, parameters, datasets, setReportState, getReportState } = props;

        funcToReturn = funcToReturn(commonFunctions, myFunctions, parameters, datasets, array, getObjVal, getReportState, setReportState);
    }

    return funcToReturn;
}

/*
export default function compileExpression(expression, props, { array, getObjVal, sandbox: exclude }) {
    if (props?.$this) {
        expression = `return (function () { return ${expression};}).call(_$this_)`;
    }
    else {
        expression = `return ${expression}`;
    }

    // parse the expression
    const parsed = acorn.parse(expression, { ecmaVersion: 6, sourceType: "script", allowReturnOutsideFunction: true });

    // pass in the parsed syntax tree into the create method
    const sb = SandBoxr.create(parsed, { exclude });
    const env = SandBoxr.createEnvironment();
    env.init();

    if (props?.$this) {
        env.createVariable("_$this_").setValue(props?.$this);
    }

    let valueFunc = function () {
        console.log("executing the expression:-", expression);
        // execute the code, which returns the result
        let result = sb.execute(env);
        // get the native value
        result = result.toNative();

        return result;
    };

    const isNoWrap = props?.noWrap === true;
    let wrapFunction = null;
    if (!isNoWrap) {
        const
            eFields = env.createVariable("Fields"),
            eRowGroup = env.createVariable("RowGroup"),
            eColGroup = env.createVariable("ColGroup"),
            eVariables = env.createVariable("Variables"),
            eField = env.createVariable("Field");

        wrapFunction = function (Fields, RowGroup, ColGroup, Variables) {
            eFields.setValue(Fields);
            eRowGroup.setValue(RowGroup);
            eColGroup.setValue(ColGroup);
            eVariables.setValue(Variables);
            const Field = function ({ value } = {}) {
                const val = getObjVal(Fields, value);

                return val;
            };
            eField.setValue(env.objectFactory.createFunction(Field));

            return valueFunc();
        };
    }

    const
        eCommonFunctions = env.createVariable("CommonFunctions"),
        eMyFunctions = env.createVariable("MyFunctions"),
        eParameters = env.createVariable("Parameters"),
        eDatasets = env.createVariable("Datasets"),
        earray = env.createVariable("array"),
        egetObjVal = env.createVariable("getObjVal"),
        eReportState = env.createVariable("ReportState"),
        esetReportState = env.createVariable("setReportState");

    let funcToReturn = function (CommonFunctions, MyFunctions, Parameters, Datasets, array, getObjVal, ReportState, setReportState) {
        eCommonFunctions.setValue(CommonFunctions);
        eMyFunctions.setValue(MyFunctions);
        eParameters.setValue(Parameters);
        eDatasets.setValue(Datasets);
        earray.setValue(array);
        egetObjVal.setValue(getObjVal);
        eReportState.setValue(ReportState);
        esetReportState.setValue(setReportState);

        if (isNoWrap) {
            return valueFunc();
        }
        else {
            return wrapFunction;
        }
    };

    //let result = compiler(exprToCompile, sandbox, props);

    if (props) {
        const { commonFunctions, myFunctions, parameters, datasets, setReportState, getReportState } = props;

        funcToReturn = funcToReturn(commonFunctions, myFunctions, parameters, datasets, array, getObjVal, getReportState, setReportState);
    }

    return funcToReturn;
}

export default function (code, sandbox) {
    code = "(function () {return {a:10, b:new Date()};})()";

    // parse the expression
    const ast = acorn.parse(code);

    // pass in the parsed syntax tree into the create method
    const sb = SandBoxr.create(ast);

    return function () {
        // execute the code, which returns the result
        const result = sb.execute();

        // get the native value
        const test = result.toNative();

        return test;
    };
}

export default function (code, sandbox) {
    return Function(...sandbox, code)();
}*/