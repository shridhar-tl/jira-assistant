import { normalizeType } from "src/display-controls";
import { parseWhereClause } from "../../editor/controls/config/filter-options/validators";
import * as functions from './functions';
import { usePivotConfig } from "../../store/pivot-config";
import { useFieldsList } from "../../utils/fields";
import moment from "moment";

const functionsMap = Object.keys(functions).reduce((result, key) => {
    result[key.toLowerCase()] = functions[key];
    return result;
}, {});

export function getFilterFunction(filterText) {
    if (!filterText?.trim()) {
        return;
    }
    const { fieldsMap } = useFieldsList.getState();
    const { parameters = {} } = usePivotConfig.getState();

    const scope = { fieldsMap, parameters };

    const json = parseWhereClause(filterText);

    return (issues) => issues.map(createFilterForArray(json, scope)).filter(Boolean);
}

function createFilterForArray(json, scope) {
    const filters = json.map(obj => createFilterForObject(obj, scope));

    return (passedIssue) => filters.reduce((issue, filter) => issue && filter(issue), passedIssue);
}

function createFilterForObject(json, scope) {
    const expressionFunc = expressionType[json.type];

    return expressionFunc(json, scope);
}


const expressionType = {
    AndExpression: create_LeftRightExpression,
    OrExpression: create_LeftRightExpression,

    ComparisonBooleanPrimary: create_ComparisonBooleanPrimary,
    BetweenPredicate: create_BetweenPredicate,

    InExpressionListPredicate: create_InExpressionListPredicate,

    Identifier: handle_Identifier,
    FunctionCall: handle_FunctionCall,

    Number: getHardCodedValues,
    String: getHardCodedValues,
    Boolean: getHardCodedValues,
    Null: getHardCodedValues,
};

function create_LeftRightExpression(expr, scope) {
    const { left, right, operator } = expr;

    const leftFn = createFilterForObject(left, scope);
    const rightFn = createFilterForObject(right, scope);

    if (operator === 'and') {
        return (issue) => leftFn(issue) && rightFn(issue);
    } else {
        return (issue) => leftFn(issue) || rightFn(issue);
    }
}

function create_ComparisonBooleanPrimary(json, scope) {
    const { left, right, operator } = json;

    const leftFn = createFilterForObject(left, scope);
    const rightFn = createFilterForObject(right, scope);

    const oprFn = createOperatorFn(operator, leftFn, rightFn);

    return (issue) => (issue && oprFn(issue) ? issue : undefined);
}

function createOperatorFn(operator, leftFn, rightFn) {
    // eslint-disable-next-line default-case
    switch (operator) {
        case '=':
            return (issue) => leftFn(issue) === rightFn(issue);

        case '!=':
        case '<>':
            return (issue) => leftFn(issue) !== rightFn(issue);

        case '>':
            return (issue) => leftFn(issue) > rightFn(issue);
        case '>=':
            return (issue) => leftFn(issue) >= rightFn(issue);
        case '<':
            return (issue) => leftFn(issue) < rightFn(issue);
        case '<=':
            return (issue) => leftFn(issue) <= rightFn(issue);
    }
}

function create_BetweenPredicate(expr, scope) {
    const { left: leftField, right: { left, right } } = expr;

    const leftFieldFn = createFilterForObject(leftField, scope);

    const leftFn = createFilterForObject(left, scope);
    const rightFn = createFilterForObject(right, scope);

    return (issue) => {
        const fieldValue = leftFieldFn(issue);

        return fieldValue >= leftFn(issue) && fieldValue <= rightFn(issue);
    };
}

function create_InExpressionListPredicate(expr, scope) {
    const { left, right } = expr;

    const leftFn = createFilterForObject(left, scope);

    return validate_ExpressionList(right, scope, leftFn);
}

function validate_ExpressionList(expr, scope, leftFn) {
    const { value } = expr;

    const values = value.map(v => createFilterForObject(v, scope));

    return (issue) => {
        const leftValue = leftFn(issue);

        for (const rightFn of values) {
            if (leftValue === rightFn(issue)) {
                return issue;
            }
        }
    };
}

function handle_Identifier(expr, scope) {
    const { value: fieldNameExpr } = expr;
    const fieldName = fieldNameExpr.toLowerCase();
    const field = scope.fieldsMap[fieldName];
    const schema = normalizeType(field);
    const { type, keyField } = schema;
    const propName = field.key;
    let converter = lCase;

    if (type === 'date' || type === 'datetime') {
        converter = convertDateTime;
    }

    if (!keyField) {
        return (issue) => converter(issue?.[propName]);
    } else if (typeof keyField === 'function') {
        return (issue) => {
            const val = issue?.[propName];

            return val && converter(keyField(val));
        };
    } else {
        return (issue) => converter(issue?.[propName]?.[keyField]);
    }
}

function lCase(value) {
    if (typeof value === 'string') {
        return value.toLowerCase();
    }

    return value ?? null;
}

function convertDateTime(value) {
    if (!value) {
        return value;
    }

    return moment(value).valueOf();
}

function handle_FunctionCall(expr, scope) {
    const { name, params } = expr;
    const funcName = name.toLowerCase();

    const func = functionsMap[funcName];

    // When no param is passed to a function, by default receives argument as null
    if (params?.length === 1 && params[0] === null) {
        params.splice(0, 1);
    }

    const args = params.map(p => createFilterForObject(p, scope));

    if (args?.length) {
        return (issue) => issue && func.apply(scope, args.map(a => a(issue)));
    } else {
        // Function without args would return same value every time.
        // There is no need of scope as well
        const funcValue = func();
        return () => funcValue;
    }
}

function getHardCodedValues(expr) {
    const { type, value } = expr;
    let valueToCompare = value;

    switch (type.toLowerCase()) {
        case 'string':
            valueToCompare = lCase(value.substring(1, value.length - 1));
            break;
        case 'number':
            valueToCompare = Number(value);
            break;
        case 'boolean':
            valueToCompare = Boolean(value);
            break;
        case 'null':
            valueToCompare = null;
            break;
        default:
            valueToCompare = lCase(value);
            break;
    }

    return () => valueToCompare;
}