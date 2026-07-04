import moment from 'moment';

import { normalizeTypeWithOptions } from '../../../../../../src/display-controls';
import { parseWhereClause } from '../../editor/controls/config/filter-options/validators';
import { usePivotConfig } from '../../store/pivot-config';
import { useFieldsList } from '../../utils/fields';

import * as functions from './functions';

const comparerFieldMapping: Record<string, string[]> = {
    parent: ['key', 'id'],
    project: ['name', 'key'],
    user: ['displayName', 'emailAddress', 'name', 'accountId'],
};

function normalizeTypeForComparison(field: any) {
    return normalizeTypeWithOptions(field, comparerFieldMapping, ['name', 'id']);
}

const likeComparerFieldMapping: Record<string, string[]> = {
    parent: ['key'],
    project: ['name', 'key'],
    user: ['displayName', 'emailAddress', 'name', 'accountId'],
};

function normalizeTypeForLikeComparison(field: any) {
    return normalizeTypeWithOptions(field, likeComparerFieldMapping, 'name');
}

const functionsMap: Record<string, Function> = Object.keys(functions).reduce((result: Record<string, Function>, key: string) => {
    result[key.toLowerCase()] = (functions as Record<string, Function>)[key];
    return result;
}, {});

export function getFilterFunction(filterText?: string) {
    if (!filterText?.trim()) {
        return;
    }
    const { fieldsMap } = useFieldsList.getState();
    const { parameters = {} } = usePivotConfig.getState();

    const scope: Scope = { fieldsMap, parameters };

    const json = parseWhereClause(filterText);

    return (issues: any[]) => issues.map(createFilterForArray(json, scope)).filter(Boolean);
}

function createFilterForArray(json: any[], scope: Scope) {
    const filters = json.map((obj: any) => createFilterForObject(obj, scope));

    return (passedIssue: any) => filters.reduce((issue: any, filter: FilterFn) => issue && filter(issue), passedIssue);
}

function createFilterForObject(json: any, scope: Scope): FilterFn {
    const expressionFunc = expressionType[json.type as keyof typeof expressionType];

    return expressionFunc(json, scope);
}

interface Scope {
    fieldsMap: Record<string, any>;
    parameters: Record<string, any>;
    isLikeComparison?: boolean;
}

interface FilterFn {
    (issue: any): any;
    returnsArrayOfValues?: boolean;
    isStaticValue?: boolean;
}

const expressionType: Record<string, (expr: any, scope: Scope) => FilterFn> = {
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

function create_LeftRightExpression(expr: any, scope: Scope): FilterFn {
    const { left, right, operator } = expr;

    const leftFn = createFilterForObject(left, scope);
    const rightFn = createFilterForObject(right, scope);

    if (operator === 'and') {
        return (issue: any) => leftFn(issue) && rightFn(issue);
    } else {
        return (issue: any) => leftFn(issue) || rightFn(issue);
    }
}

function create_ComparisonBooleanPrimary(json: any, scope: Scope): FilterFn {
    const { left, right, operator } = json;

    const leftFn = createFilterForObject(left, scope);
    const rightFn = createFilterForObject(right, scope);

    let oprFn: (issue: any) => any;
    if (leftFn.returnsArrayOfValues) {
        oprFn = createArrayOperatorFn(operator, leftFn, rightFn);
    } else if (rightFn.returnsArrayOfValues) {
        oprFn = createArrayOperatorFn(operator, rightFn, leftFn);
    } else {
        oprFn = createOperatorFn(operator, leftFn, rightFn);
    }

    return (issue: any) => (issue && oprFn(issue) ? issue : undefined);
}

function createOperatorFn(operator: string, leftFn: FilterFn, rightFn: FilterFn): (issue: any) => any {
    switch (operator) {
        case '=':
            return (issue: any) => leftFn(issue) === rightFn(issue);

        case '!=':
        case '<>':
            return (issue: any) => leftFn(issue) !== rightFn(issue);

        case '>':
            return (issue: any) => leftFn(issue) > rightFn(issue);
        case '>=':
            return (issue: any) => leftFn(issue) >= rightFn(issue);
        case '<':
            return (issue: any) => leftFn(issue) < rightFn(issue);
        case '<=':
            return (issue: any) => leftFn(issue) <= rightFn(issue);
        default:
            return () => false; // This case should never happen, but just a warning fix
    }
}

function createArrayOperatorFn(operator: string, leftFn: FilterFn, rightFn: FilterFn): (issue: any) => any {
    switch (operator) {
        case '=':
            return (issue: any) => leftFn(issue).includes(rightFn(issue));

        case '!=':
        case '<>':
            return (issue: any) => !leftFn(issue).includes(rightFn(issue));
        default:
            return () => false; // This case should never happen, but just a warning fix
    }
}

function create_BetweenPredicate(expr: any, scope: Scope): FilterFn {
    const {
        left: leftField,
        right: { left, right },
    } = expr;

    const leftFieldFn = createFilterForObject(leftField, scope);

    const leftFn = createFilterForObject(left, scope);
    const rightFn = createFilterForObject(right, scope);

    return (issue: any) => {
        const fieldValue = leftFieldFn(issue);

        return fieldValue >= leftFn(issue) && fieldValue <= rightFn(issue);
    };
}

function create_InExpressionListPredicate(expr: any, scope: Scope): FilterFn {
    const { left, right, hasNot } = expr;

    const leftFn = createFilterForObject(left, scope);

    return validate_ExpressionList(right, scope, leftFn, !!hasNot);
}

function validate_ExpressionList(expr: any, scope: Scope, leftFn: FilterFn, hasNot: boolean): FilterFn {
    const { value } = expr;

    let values: any[] = value.map((v: any) => createFilterForObject(v, scope));

    if (values.length === 1 && value[0].name?.toLowerCase() === 'parameters' && value[0].type === 'FunctionCall') {
        values = values[0]();
    }

    if (leftFn.returnsArrayOfValues) {
        return (issue: any) => {
            const leftValue = leftFn(issue);

            for (let rightFn of values) {
                if (typeof rightFn === 'function') {
                    // When parameters are directly as first argument, array would contain direct values itself
                    rightFn = rightFn(issue);
                }

                if (leftValue.includes(rightFn)) {
                    return hasNot ? null : issue;
                }
            }

            if (hasNot) {
                // If nothing matches execution reaches this position and if its not case, then return issue
                return issue;
            }
        };
    } else {
        return (issue: any) => {
            const leftValue = leftFn(issue);

            for (const rightFn of values) {
                if (leftValue === rightFn(issue)) {
                    return hasNot ? null : issue;
                }
            }

            if (hasNot) {
                // If nothing matches execution reaches this position and if its not case, then return issue
                return issue;
            }
        };
    }
}

function create_LikePredicate(expr: any, scope: Scope): FilterFn {
    scope = { ...scope, isLikeComparison: true }; // Modify scope so that old scope is not used

    const { left, right, hasNot } = expr;

    const leftFn = createFilterForObject(left, scope);

    return validate_LikeExpression(right, scope, leftFn, !!hasNot);
}

function validate_LikeExpression(expr: any, scope: Scope, leftFn: FilterFn, hasNot: boolean): FilterFn {
    let { value } = expr;
    value = value.substring(1, value.length - 1);

    value = new RegExp(`^${value.replace(/%/g, '.*').replace(/_/g, '.')}$`, 'im');

    if (leftFn.returnsArrayOfValues) {
        return (issue: any) => {
            if (leftFn(issue).some((val: any) => value.test(val))) {
                return hasNot ? null : issue;
            }

            if (hasNot) {
                return issue;
            }
        };
    } else {
        return (issue: any) => {
            if (value.test(leftFn(issue))) {
                return hasNot ? null : issue;
            }

            if (hasNot) {
                return issue;
            }
        };
    }
}

function handle_Identifier(expr: any, scope: Scope): FilterFn {
    const { value: fieldNameExpr } = expr;
    const fieldName = fieldNameExpr.toLowerCase();
    const field = scope.fieldsMap[fieldName];
    const schema = scope.isLikeComparison ? normalizeTypeForLikeComparison(field) : normalizeTypeForComparison(field);
    const { type, keyField } = schema;
    const propName = field.key;
    let converter: any = toComparableCase;

    if (type === 'date' || type === 'datetime') {
        converter = convertDateTime;
    }

    if (!keyField) {
        return (issue: any) => converter(issue?.[propName]);
    } else if (Array.isArray(keyField)) {
        converter = (issue: any) => {
            if (!issue) {
                return null;
            }

            const valObj = issue[propName];

            if (typeof valObj !== 'object') {
                return valObj;
            }

            return keyField.map((k: string) => toComparableCase(valObj[k]) ?? {}); // if the prop value is null then construct empty object so that it doesn't match comparison
        };

        converter.returnsArrayOfValues = true;

        return converter;
    } else if (typeof keyField === 'function') {
        return (issue: any) => {
            const val = issue?.[propName];

            return val && converter(keyField(val));
        };
    } else {
        return (issue: any) => converter(issue?.[propName]?.[keyField]);
    }
}

function toComparableCase(value: any): any {
    if (typeof value === 'string') {
        return value.toLowerCase();
    }

    return value ?? null;
}

function convertDateTime(value: any): number | undefined {
    if (!value) {
        return value;
    }

    return moment(value).valueOf();
}

function handle_FunctionCall(expr: any, scope: Scope): FilterFn {
    const { name, params } = expr;
    const funcName = name.toLowerCase();

    const func = functionsMap[funcName];

    // When no param is passed to a function, by default receives argument as null
    if (params?.length === 1 && params[0] === null) {
        params.splice(0, 1);
    }

    const args: FilterFn[] = params.map((p: any) => createFilterForObject(p, scope));

    if (args?.length && args.some((a: FilterFn) => !a.isStaticValue)) {
        return (issue: any) =>
            issue &&
            func.apply(
                scope,
                args.map((a: FilterFn) => a(issue)),
            );
    } else {
        // Function without args or arguments which is static would return same value every time.
        // There is no need of passing scope as well except for parameters function
        const funcValue = func.apply(
            scope,
            args.map((a: any) => a()),
        );
        const funcResult: FilterFn = () => funcValue;
        (func as any).isStaticValue = true;
        return funcResult;
    }
}

function getHardCodedValues(expr: any): FilterFn {
    const { type, value } = expr;
    let valueToCompare: any = value;

    switch (type.toLowerCase()) {
        case 'string':
            valueToCompare = toComparableCase(value.substring(1, value.length - 1));
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
            valueToCompare = toComparableCase(value);
            break;
    }

    const func: FilterFn = () => valueToCompare;
    func.isStaticValue = true;
    return func;
}
