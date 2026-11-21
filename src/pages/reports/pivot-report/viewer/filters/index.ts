import moment from 'moment';

import { normalizeTypeWithOptions } from '@/display-controls';
import { parseWhereClause } from '../../editor/controls/config/filter-options/validators';
import { useReportParameters } from '../../store/report-parameters';
import type { ReportParameters } from '../../types';
import { useFieldsList } from '../../utils/fields';

import * as functions from './functions';

const comparerFieldMapping: Record<string, string[]> = {
    parent: ['key', 'id'],
    project: ['name', 'key'],
    user: ['displayName', 'emailAddress', 'name', 'accountId'],
    option: ['value', 'id'],
    'option-with-child': ['value', 'id'],
    version: ['name', 'id'],
    group: ['name', 'groupId'],
};

function normalizeTypeForComparison(field: any) {
    return normalizeTypeWithOptions(field, comparerFieldMapping, ['name', 'id']);
}

const likeComparerFieldMapping: Record<string, string[]> = {
    parent: ['key'],
    project: ['name', 'key'],
    user: ['displayName', 'emailAddress', 'name', 'accountId'],
    option: ['value'],
    'option-with-child': ['value'],
    version: ['name'],
    group: ['name'],
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
    const { parameters } = useReportParameters.getState();

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
    parameters: ReportParameters;
    isLikeComparison?: boolean;
    keepStringCase?: boolean;
}

interface FilterFn {
    (issue: any): any;
    returnsArrayOfValues?: boolean;
    isStaticValue?: boolean;
    isDate?: boolean;
}

function toDateValue(value: unknown): unknown {
    if (value instanceof Date) {
        return value.getTime();
    }

    if (Array.isArray(value)) {
        return value.map(toDateValue);
    }

    return typeof value === 'string' ? convertDateTime(value) : value;
}

function asDateOperand(fn: FilterFn): FilterFn {
    const wrapped: FilterFn = (issue: Issue) => toDateValue(fn(issue));
    wrapped.isStaticValue = fn.isStaticValue;
    wrapped.returnsArrayOfValues = fn.returnsArrayOfValues;

    return wrapped;
}

function asDateOperands(left: FilterFn, right: FilterFn): [FilterFn, FilterFn] {
    if (left.isDate && !right.isDate) {
        return [left, asDateOperand(right)];
    }

    if (right.isDate && !left.isDate) {
        return [asDateOperand(left), right];
    }

    return [left, right];
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

    const [leftFn, rightFn] = asDateOperands(createFilterForObject(left, scope), createFilterForObject(right, scope));

    let oprFn: (issue: any) => any;
    if (leftFn.returnsArrayOfValues) {
        oprFn = createArrayOperatorFn(operator, leftFn, rightFn);
    } else if (rightFn.returnsArrayOfValues) {
        oprFn = createArrayOperatorFn(mirroredOperators[operator] || operator, rightFn, leftFn);
    } else {
        oprFn = createOperatorFn(operator, leftFn, rightFn);
    }

    return (issue: any) => (issue && oprFn(issue) ? issue : undefined);
}

const mirroredOperators: Record<string, string> = { '>': '<', '>=': '<=', '<': '>', '<=': '>=' };

const rangeComparers: Record<string, (left: RangeValue, right: RangeValue) => boolean> = {
    '>': (a, b) => a > b,
    '>=': (a, b) => a >= b,
    '<': (a, b) => a < b,
    '<=': (a, b) => a <= b,
};

function createOperatorFn(operator: string, leftFn: FilterFn, rightFn: FilterFn): (issue: any) => any {
    switch (operator) {
        case '=':
            return (issue: any) => leftFn(issue) === rightFn(issue);

        case '!=':
        case '<>':
            return (issue: any) => leftFn(issue) !== rightFn(issue);

        case '>':
        case '>=':
        case '<':
        case '<=':
            return createRangeComparer(leftFn, rightFn, rangeComparers[operator]);
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

function createAnyValueRangeComparer(valuesFn: FilterFn, rightFn: FilterFn, compare: (left: RangeValue, right: RangeValue) => boolean) {
    return (issue: Issue) => {
        const right = rightFn(issue);

        return !isEmptyOperand(right) && (valuesFn(issue) as RangeValue[]).some((value) => !isEmptyOperand(value) && compare(value, right));
    };
}

function createArrayOperatorFn(operator: string, leftFn: FilterFn, rightFn: FilterFn): (issue: any) => any {
    switch (operator) {
        case '=':
            return (issue: any) => arrayContains(leftFn(issue), rightFn(issue));

        case '!=':
        case '<>':
            return (issue: any) => !arrayContains(leftFn(issue), rightFn(issue));

        case '>':
        case '>=':
        case '<':
        case '<=':
            return createAnyValueRangeComparer(leftFn, rightFn, rangeComparers[operator]);
        default:
            return () => false; // This case should never happen, but just a warning fix
    }
}

function arrayContains(values: unknown[], value: unknown) {
    return isEmptyOperand(value) ? !values.length : values.includes(value);
}

function create_BetweenPredicate(expr: any, scope: Scope): FilterFn {
    const {
        left: leftField,
        right: { left, right },
    } = expr;

    const leftFieldFn = createFilterForObject(leftField, scope);

    const leftFn = withFieldType(leftFieldFn, createFilterForObject(left, scope));
    const rightFn = withFieldType(leftFieldFn, createFilterForObject(right, scope));

    return (issue: any) => {
        const fieldValue = leftFieldFn(issue);

        return issue && !isEmptyOperand(fieldValue) && fieldValue >= leftFn(issue) && fieldValue <= rightFn(issue) ? issue : undefined;
    };
}

function withFieldType(fieldFn: FilterFn, valueFn: FilterFn): FilterFn {
    return fieldFn.isDate && !valueFn.isDate ? asDateOperand(valueFn) : valueFn;
}

function create_InExpressionListPredicate(expr: any, scope: Scope): FilterFn {
    const { left, right, hasNot } = expr;

    const leftFn = createFilterForObject(left, scope);

    return validate_ExpressionList(right, scope, leftFn, !!hasNot);
}

function validate_ExpressionList(expr: any, scope: Scope, leftFn: FilterFn, hasNot: boolean): FilterFn {
    const { value } = expr;

    let values: FilterFn[] = value.map((v: any) => withFieldType(leftFn, createFilterForObject(v, scope)));

    if (values.length === 1 && value[0].name?.toLowerCase() === 'parameters' && value[0].type === 'FunctionCall') {
        // When parameters are directly as first argument, it returns the list of values itself
        values = toStaticValueFns(values[0](null));
    }

    if (leftFn.returnsArrayOfValues) {
        return (issue: any) => {
            const leftValue = leftFn(issue);

            for (const rightFn of values) {
                if (leftValue.includes(rightFn(issue))) {
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

function toStaticValueFns(value: unknown): FilterFn[] {
    const list = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];

    return list.map((item) => {
        const fn: FilterFn = () => item;
        fn.isStaticValue = true;
        return fn;
    });
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
        fn.isDate = isDate;

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
        const fn: FilterFn = (issue: any) => converter(issue?.[propName]);
        fn.isDate = isDate;

        return fn;
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

    const argScope: Scope = { ...scope, keepStringCase: true };
    const args: FilterFn[] = params.map((p: any) => createFilterForObject(p, argScope));

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

function getHardCodedValues(expr: any, scope?: Scope): FilterFn {
    const { type, value } = expr;
    let valueToCompare: any = value;

    switch (type.toLowerCase()) {
        case 'string': {
            const text = value.substring(1, value.length - 1);
            valueToCompare = scope?.keepStringCase ? text : toComparableCase(text);
            break;
        }
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
