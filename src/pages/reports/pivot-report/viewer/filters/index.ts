import moment from 'moment';

import { normalizeTypeWithOptions } from '@/display-controls';
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

type Issue = Record<string, unknown>;

interface PrefixExpression {
    prefix: string;
    value: { type: string; value: string };
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

    Prefix: handle_Prefix,
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
            return createRangeComparer(leftFn, rightFn, (a, b) => a > b);
        case '>=':
            return createRangeComparer(leftFn, rightFn, (a, b) => a >= b);
        case '<':
            return createRangeComparer(leftFn, rightFn, (a, b) => a < b);
        case '<=':
            return createRangeComparer(leftFn, rightFn, (a, b) => a <= b);
        default:
            return () => false; // This case should never happen, but just a warning fix
    }
}

function isEmptyOperand(value: unknown) {
    return value === null || value === undefined || value === '';
}

type RangeValue = number | string;

/**
 * Empty values are never considered as lesser or greater than any value
 */
function createRangeComparer(leftFn: FilterFn, rightFn: FilterFn, compare: (left: RangeValue, right: RangeValue) => boolean) {
    return (issue: Issue) => {
        const left = leftFn(issue);
        const right = rightFn(issue);

        return !isEmptyOperand(left) && !isEmptyOperand(right) && compare(left, right);
    };
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

        return issue && !isEmptyOperand(fieldValue) && fieldValue >= leftFn(issue) && fieldValue <= rightFn(issue) ? issue : undefined;
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

function getFieldName(identifier: string) {
    const fieldName = identifier.toLowerCase();

    return fieldName.startsWith('`') ? fieldName.substring(1, fieldName.length - 1) : fieldName;
}

function handle_Identifier(expr: any, scope: Scope): FilterFn {
    const { value: fieldNameExpr } = expr;
    const field = scope.fieldsMap[getFieldName(fieldNameExpr)];

    if (!field) {
        throw new Error(`Unknown field ${fieldNameExpr}`);
    }

    const schema = scope.isLikeComparison ? normalizeTypeForLikeComparison(field) : normalizeTypeForComparison(field);
    const { type, keyField } = schema;
    const propName: string = field.key;
    const isDate = type === 'date' || type === 'datetime';
    const converter: (value: unknown) => unknown = isDate ? convertDateTime : toComparableCase;

    if (field.schema?.derived && propName.includes('.')) {
        const [path, prop] = propName.split('.');
        const fn: FilterFn = (issue: Issue) => {
            const items = issue?.[path];
            const values = (Array.isArray(items) ? items : items ? [items] : []).map((item: Issue) => item?.[prop]);

            return toComparableValues(values, keyField, converter);
        };
        fn.returnsArrayOfValues = true;

        return fn;
    }

    if (field.schema?.type === 'array') {
        const fn: FilterFn = (issue: Issue) => {
            const values = issue?.[propName];

            return toComparableValues(Array.isArray(values) ? values : [], undefined, converter);
        };
        fn.returnsArrayOfValues = true;

        return fn;
    }

    if (!keyField) {
        return (issue: any) => converter(issue?.[propName]);
    } else if (Array.isArray(keyField)) {
        const fn: FilterFn = (issue: any) => {
            if (!issue) {
                return null;
            }

            const valObj = issue[propName];

            if (valObj === null || valObj === undefined) {
                return [];
            }

            if (typeof valObj !== 'object') {
                return [toComparableCase(valObj)];
            }

            return keyField.map((k: string) => toComparableCase(valObj[k]));
        };

        fn.returnsArrayOfValues = true;

        return fn;
    } else if (typeof keyField === 'function') {
        return (issue: any) => {
            const val = issue?.[propName];

            return val && converter(keyField(val));
        };
    } else {
        return (issue: any) => converter(issue?.[propName]?.[keyField]);
    }
}

const arrayItemProps = ['displayName', 'emailAddress', 'name', 'value', 'key', 'id', 'accountId'];

function toComparableValues(values: unknown[], keyField: unknown, converter: (value: unknown) => unknown): unknown[] {
    const props = Array.isArray(keyField) ? keyField : typeof keyField === 'string' ? [keyField] : arrayItemProps;

    return values.flatMap((value) => {
        if (value === null || value === undefined) {
            return [];
        }

        if (typeof value !== 'object') {
            return [converter(value)];
        }

        const obj = value as Record<string, unknown>;

        return props.filter((p) => obj[p] !== undefined && obj[p] !== null).map((p) => toComparableCase(obj[p]));
    });
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
        funcResult.isStaticValue = true;
        return funcResult;
    }
}

function handle_Prefix(expr: PrefixExpression): FilterFn {
    const { prefix, value } = expr;
    const signedValue = Number(`${prefix}${value.value}`);

    const func: FilterFn = () => signedValue;
    func.isStaticValue = true;
    return func;
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
