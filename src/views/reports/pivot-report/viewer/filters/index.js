import { normalizeTypeWithOptions } from "src/display-controls";
import { parseWhereClause } from "../../editor/controls/config/filter-options/validators";
import * as functions from './functions';
import { usePivotConfig } from "../../store/pivot-config";
import { useFieldsList } from "../../utils/fields";
import moment from "moment";

const comparerFieldMapping = {
    parent: ['key', 'id'],
    project: ['name', 'key'],
    user: ['displayName', 'emailAddress', 'name', 'accountId']
};

function normalizeTypeForComparison(field) {
    return normalizeTypeWithOptions(field, comparerFieldMapping, ['name', 'id']);
}

const likeComparerFieldMapping = {
    parent: ['key'],
    project: ['name', 'key'],
    user: ['displayName', 'emailAddress', 'name', 'accountId']
};

function normalizeTypeForLikeComparison(field) {
    return normalizeTypeWithOptions(field, likeComparerFieldMapping, 'name');
}

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
    LikePredicate: create_LikePredicate,

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

    let oprFn;
    if (leftFn.returnsArrayOfValues) {
        oprFn = createArrayOperatorFn(operator, leftFn, rightFn);
    } else if (rightFn.returnsArrayOfValues) {
        oprFn = createArrayOperatorFn(operator, rightFn, leftFn);
    } else {
        oprFn = createOperatorFn(operator, leftFn, rightFn);
    }

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

function createArrayOperatorFn(operator, leftFn, rightFn) {
    // eslint-disable-next-line default-case
    switch (operator) {
        case '=':
            return (issue) => leftFn(issue).includes(rightFn(issue));

        case '!=':
        case '<>':
            return (issue) => !leftFn(issue).includes(rightFn(issue));
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
    const { left, right, hasNot } = expr;

    const leftFn = createFilterForObject(left, scope);

    return validate_ExpressionList(right, scope, leftFn, !!hasNot);
}

function validate_ExpressionList(expr, scope, leftFn, hasNot) {
    const { value } = expr;

    const values = value.map(v => createFilterForObject(v, scope));

    if (leftFn.returnsArrayOfValues) {
        return (issue) => {
            const leftValue = leftFn(issue);

            for (const rightFn of values) {
                if (leftValue.includes(rightFn(issue))) {
                    return hasNot ? null : issue;
                }
            }

            if (hasNot) { // If nothing matches execution reaches this position and if its not case, then return issue
                return issue;
            }
        };
    } else {
        return (issue) => {
            const leftValue = leftFn(issue);

            for (const rightFn of values) {
                if (leftValue === rightFn(issue)) {
                    return hasNot ? null : issue;
                }
            }

            if (hasNot) { // If nothing matches execution reaches this position and if its not case, then return issue
                return issue;
            }
        };
    }
}

function create_LikePredicate(expr, scope) {
    scope = { ...scope, isLikeComparison: true }; // Modify scope so that old scope is not used

    const { left, right, hasNot } = expr;

    const leftFn = createFilterForObject(left, scope);

    return validate_LikeExpression(right, scope, leftFn, !!hasNot);
}

function validate_LikeExpression(expr, scope, leftFn, hasNot) {
    let { value } = expr;
    value = value.substring(1, value.length - 1);

    value = new RegExp(`^${value.replace(/%/g, '.*').replace(/_/g, '.')}$`, 'im');

    if (leftFn.returnsArrayOfValues) {
        return (issue) => {
            if (leftFn(issue).some(val => value.test(val))) {
                return hasNot ? null : issue;
            }

            if (hasNot) { return issue; }
        };
    } else {
        return (issue) => {
            if (value.test(leftFn(issue))) {
                return hasNot ? null : issue;
            }

            if (hasNot) { return issue; }
        };
    }
}

function handle_Identifier(expr, scope) {
    const { value: fieldNameExpr } = expr;
    const fieldName = fieldNameExpr.toLowerCase();
    const field = scope.fieldsMap[fieldName];
    const schema = scope.isLikeComparison ? normalizeTypeForLikeComparison(field) : normalizeTypeForComparison(field);
    const { type, keyField } = schema;
    const propName = field.key;
    let converter = lCase;

    if (type === 'date' || type === 'datetime') {
        converter = convertDateTime;
    }

    if (!keyField) {
        return (issue) => converter(issue?.[propName]);
    } else if (Array.isArray(keyField)) {
        converter = (issue) => {
            if (!issue) {
                return null;
            }

            const valObj = issue[propName];

            if (typeof valObj !== 'object') {
                return valObj;
            }

            return keyField.map(k => lCase(valObj[k]) ?? {}); // if the prop value is null then construct empty object so that it doesn't match comparison
        };

        converter.returnsArrayOfValues = true;

        return converter;
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

    if (args?.length && args.some(a => !a.isStaticValue)) {
        return (issue) => issue && func.apply(scope, args.map(a => a(issue)));
    } else {
        // Function without args or arguments which is static would return same value every time.
        // There is no need of passing scope as well
        const funcValue = func();
        const funcResult = () => funcValue;
        func.isStaticValue = true;
        return funcResult;
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

    const func = () => valueToCompare;
    func.isStaticValue = true;
    return func;
}