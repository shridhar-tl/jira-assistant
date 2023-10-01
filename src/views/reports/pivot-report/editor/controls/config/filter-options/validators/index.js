import parser from 'js-sql-parser';
import { allowedFunctionsMap, paramsFunctionName } from './functions';

export function parseWhereClause(filterText) {
    const result = parser.parse(`select * from json where (${filterText})`);
    const json = result.value?.where?.value?.value;

    return json;
}

export function validateFilterText(filterText, scope) {
    try {
        const json = parseWhereClause(filterText);

        return validateFilterJson(json, scope);
    } catch (err) {
        return {
            isValid: false,
            errorMessage: err.message
        };
    }
}

function validateFilterJson(json, scope) {
    if (!json || typeof json === 'string' || !Array.isArray(json)) {
        return { isValid: false, errorMessage: 'Query is incomplete' };
    }

    try {
        const result = validateExpression(json, scope);

        return { isValid: true, json, result };
    } catch (err) {
        return { errorMessage: err.message, json };
    }
}

function validateExpression(json, result) {
    json.forEach(obj => {
        if (!comparers[obj.type]) {
            throw new Error('Query is incomplete. Missing comparison');
        }

        validateObject(obj, result);
    });
    return result;
}

function validateObject(json, result, leftPart) {
    const { type, operator } = json;
    const expressionFunc = expressionType[type];

    if (!expressionFunc) {
        throw new Error(`Usage of ${operator || type} is unsupported`);
    }

    return normalizeReturnType(expressionFunc(json, result, leftPart));
}

const derivedTypes = { date: 'datetime' };
function normalizeReturnType(returnType) {
    let type = returnType?.type || returnType;

    if (!type) {
        return returnType;
    }

    if (Array.isArray(type)) {
        type = type.map(t => derivedTypes[t] || t).distinct();
        if (type.length < 2) {
            type = type[0];
        }
    } else if (typeof type === 'string') {
        type = derivedTypes[type] || type;
    }

    if (!type) {
        return returnType;
    }

    if (typeof returnType === 'object' && !Array.isArray(returnType)) {
        return { ...returnType, type };
    }

    return type;
}

const comparers = {
    AndExpression: validate_LeftAndRightExpression,
    OrExpression: validate_LeftAndRightExpression,

    ComparisonBooleanPrimary: validate_ComparisonBooleanPrimary,
    BetweenPredicate: validate_BetweenPredicate,
    LikePredicate: validate_LikePredicate,

    InExpressionListPredicate: validate_InExpressionListPredicate,
};

const expressionType = {
    ...comparers,

    Identifier: validate_Identifier,
    FunctionCall: validate_FunctionCall,

    Number: validate_direct_values,
    String: validate_direct_values,
    Boolean: validate_direct_values,
    Null: validate_direct_values,
};

function validate_LeftAndRightExpression(andExpr, result) {
    const { left, right } = andExpr;

    validateObject(left, result);
    validateObject(right, result);
}


const rangeCompatibleTypes = ['number', 'date', 'datetime', 'timespent'];
function validate_ComparisonBooleanPrimary(eqExpr, result) {
    const { left, right, operator } = eqExpr;

    const type1 = validateObject(left, result);

    if ((operator.includes('<') || operator.includes('>')) && !compareTypes(type1, rangeCompatibleTypes)) {
        throw new Error(`Incompatible types used with "${operator}" comparer`);
    }

    const type2 = validateObject(right, result, { type: type1 });

    if (!compareTypes(type1, type2)) {
        throw new Error(`"${operator}" comparison done between incompatible types`);
    }
}

function validate_BetweenPredicate(eqExpr, result) {
    const { left: leftField, right: { left, right } } = eqExpr;

    const leftFieldType = validateObject(leftField, result);
    const message = `Incompatible types used with between predicate`;

    if (!compareTypes(leftFieldType, rangeCompatibleTypes)) {
        throw new Error(message);
    }

    const type1 = validateObject(left, result, { type: leftFieldType });
    const type2 = validateObject(right, result, { type: leftFieldType });

    if (!compareTypes(leftFieldType, type1) || !compareTypes(leftFieldType, type2) || !compareTypes(type1, type2)) {
        throw new Error(`Between predicate used with in-compatible types`);
    }
}

const fieldsNotSupportedForLikeComparison = ['date', 'datetime', 'number', 'timespent'];
function validate_LikePredicate(likeExpr, result) {
    const { left, right } = likeExpr;

    const type1 = validateObject(left, result);

    if (compareTypes(type1, fieldsNotSupportedForLikeComparison)) {
        throw new Error(`Like comparison is used with incompatible types`);
    }

    const { type: rightType, value } = right;
    if (rightType.toLowerCase() !== 'string') {
        throw new Error('Only string is supported on right hand side of Like predicate');
    }

    if (!['*', '.', '%', '_'].some(p => value.includes(p))) {
        throw new Error('The string in right hand side of Like predicate doesn\'t contain any expressions and would never be met. Either use some expression or use other operators');
    }

    if (value.replace(/[%.*]/g, '').length < 3) { // Length includes enclosing double quotes
        throw new Error('The string in right hand side of Like predicate is too short. Either use some expression or use other operators');
    }

    const type2 = validateObject(right, result, { type: type1 });

    if (!compareTypes(type2, ['string'])) {
        throw new Error(`Like comparison done between incompatible types`);
    }
}


function validate_InExpressionListPredicate(expr, result) {
    const { left, right } = expr;

    const type1 = validateObject(left, result);
    validate_ExpressionList(right, result, { type: type1 });
}

function validate_ExpressionList(expr, result, leftPart) {
    const { value } = expr;

    for (const item of value) {
        const itemType = validateObject(item, result, leftPart);

        if (!compareTypes(leftPart.type, itemType)) {
            throw new Error(`List contains in-compatible types`);
        }
    }
}


function validate_Identifier(obj, result) {
    const { value } = obj;
    let fieldName = value.toLowerCase();
    if (fieldName.startsWith('`')) {
        fieldName = fieldName.substring(1, fieldName.length - 1);
    }
    const field = result.fieldsMap[fieldName];

    if (!field) {
        throw new Error(`Unknown field ${value}`);
    }

    result.fields[fieldName] = true;

    return field.schema;
}

function validate_FunctionCall(obj, result, leftPart) {
    const { name, params } = obj;
    const funcName = name.toLowerCase();

    const func = allowedFunctionsMap[funcName];

    if (!func) {
        throw new Error(`Unknown function ${name}`);
    }

    let { returns } = func;
    const { parameters } = func;
    const allowedParamsCount = parameters?.length || 0;

    // When no param is passed to a function, by default receives argument as null
    if (params?.length === 1 && params[0] === null) {
        params.splice(0, 1);
    }

    if (params?.length > allowedParamsCount) {
        throw new Error(`Expected ${parameters?.length || 0} arguments for function "${name}", but passed ${params?.length || 0}`);
    }

    for (let i = 0; i < allowedParamsCount; i++) {
        const cur = parameters[i];
        const passed = params[i];

        if (!passed && !cur.optional) {
            throw new Error(`Missing arguments for function ${name}`);
        }

        const returnType = validateObject(passed, result, cur);

        if (!compareTypes(returnType, cur.type)) {
            throw new Error(`Type mismatch for argument ${i + 1} on ${name}`);
        }

        // If return type starts with ":" and matches with ":" followed by param name,
        // then the type of param would be the return type of this function
        if (returns === `:${cur.paramName}`) {
            returns = returnType?.type || returnType;
        }
    }

    if (typeof returns === 'string' && returns.startsWith(':')) {
        throw new Error(`Unknown return type ${returns} for function ${name}`);
    }

    validateParametersFunctionArgs(funcName, params, result, leftPart);

    return returns; // ToDo:Need to wrap inside object with param type
}

function validateParametersFunctionArgs(funcName, params, result, leftPart) {
    if (funcName === paramsFunctionName) {
        const nameParam = params[0];
        const paramType = nameParam.type.toLowerCase();

        if (paramType !== 'string') { // As string is compatible with any type, above check will not handle this case
            throw new Error(`Parameter name must be a string, but passed ${paramType}`);
        }

        const paramNameWithoutQuotes = nameParam.value.substring(1, nameParam.value.length - 1);

        if (paramNameWithoutQuotes.length < 5) { // Param name would be enclosed with "". Hence considered 3 char param name
            throw new Error(`Parameter name is too short`);
        }

        if (paramNameWithoutQuotes.length > 27) { // Param name would be enclosed with "". Hence considered 25 char param name
            throw new Error(`Parameter name is too big`);
        }

        const nameLCase = paramNameWithoutQuotes.toLowerCase();

        const existingParam = result.parameters[nameLCase];
        if (existingParam && !compareTypes(leftPart.type, existingParam.type)) {
            throw new Error(`Parameter ${nameParam.value} is used across incompatible types`);
        }

        result.parameters[nameLCase] = { name: paramNameWithoutQuotes, type: leftPart.type?.type || leftPart.type };
    }
}

function validate_direct_values(obj) {
    const { type } = obj;

    return { type: type.toLowerCase() };
}


function compareTypes(type1, type2) {
    if (!type1 || !type2) {
        return false;
    }

    type1 = convertToComparableType(type1);
    type2 = convertToComparableType(type2);

    if (type1 === true || type2 === true || type1 === type2) {
        return true;
    }

    if (type1 === 'string') {
        if (!type2.includes('string') && type2.includes('number')) {
            return false;
        }
        return true;
    }

    if (type2 === 'string') {
        if (!type1.includes('string') && type1.includes('number')) {
            return false;
        }
        return true;
    }

    return type1.some(t => type2.includes(t));
}

function convertToComparableType(type) {
    if (typeof type === 'object' && !Array.isArray(type)) { // ToDo: Handle array types
        const { type: actualType, compatibleTypes } = type;
        type = actualType;
        if (compatibleTypes?.length) {
            type = [...compatibleTypes, type];
        }
    }

    if (!type || type === 'null' || type === 'any') { return true; }

    if (type === 'string') {
        return type;
    }

    if (!Array.isArray(type)) {
        if (type === 'any') {
            return true;
        }

        type = [type];
    }

    if (type.includes('any')) { return true; }

    return type;
}
