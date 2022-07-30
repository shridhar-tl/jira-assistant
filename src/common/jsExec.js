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

export function parseCustExpr(expression) {
    if (expression.indexOf('\n') > -1) {
        expression = `(function () { ${expression} }).call(this)`;
    }

    try {
        return parse(expression, parserOptions)?.body[0];
    } catch (err) {
        return err.toString();
    }
}

export function execAst(ast, env) {
    return exec(ast, env);
}
