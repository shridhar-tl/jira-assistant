import { parse } from 'espree';
import exec from 'static-eval';

const parserOptions = {
    ecmaVersion: 10,
    sourceType: 'script' as const,
    ecmaFeatures: {
        jsx: false,
        globalReturn: false,
        impliedStrict: true,
    },
};

export function parseCustExpr(expression: string): any {
    if (expression.indexOf('\n') > -1) {
        expression = `(function () { ${expression} }).call(this)`;
    }

    try {
        return parse(expression, parserOptions)?.body[0];
    } catch (err: any) {
        return err.toString();
    }
}

export function execAst(ast: any, env: any): any {
    return exec(ast, env);
}
