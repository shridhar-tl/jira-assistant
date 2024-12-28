import exec from 'static-eval';
import { parse } from 'espree';

const parserOptions = {
    ecmaVersion: 10, sourceType: "script", ecmaFeatures: {
        jsx: false,
        globalReturn: false,
        impliedStrict: true
    }
};

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
