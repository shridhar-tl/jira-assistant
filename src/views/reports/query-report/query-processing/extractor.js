// Main exported function
export function extractInfo(parsedJson) {
    const context = {
        tables: [],
        parameters: [],
        aliasMap: {}
    };

    extractSelectQuery(parsedJson, context);

    return context;
}

function extractSelectQuery(parsedJson, context) {
    // Extract tables from FROM clause
    extractTables(parsedJson.from, context);

    if (context.tables.length > 1) {
        const tablesWithoutAlias = context.tables.filter(t => !t.alias);
        if (tablesWithoutAlias.length) {
            throw new Error(`Table alias is required when joins/subqueries are used. Provide alias for: ${tablesWithoutAlias.map(t => t.name).join(', ')}`);
        }
    }

    // Extract columns from SELECT, WHERE, GROUP BY, ORDER BY
    extractColumns(parsedJson, context);

    // Extract filters from WHERE and JOIN ON clauses
    // Already handled in extractColumns and extractTables

    // Extract parameters
    extractParameters(parsedJson, context);
}

function addTableAlias(table, context) {
    const tableAlias = table.alias;

    if (!tableAlias) { return; }

    context.isAliasNeeded = true;

    const map = context.aliasMap;
    const existingTable = map[tableAlias];

    if (existingTable) {
        throw new Error(`Same alias "${tableAlias}" used for more than one table: ${existingTable.name} and ${table.name}`);
    }

    map[tableAlias] = table;

}

function extractTables(fromClause, context) {
    if (!fromClause || !Array.isArray(fromClause.value)) {
        return;
    }

    fromClause.value.forEach(tableRef => {
        processTableReference(tableRef, context);
    });
}

// Helper function to process each table reference
function processTableReference(tableRef, context) { // eslint-disable-line complexity
    if (!tableRef || !tableRef.type) {
        return;
    }

    if (tableRef.type === 'TableReference') {
        processTableReference(tableRef.value, context);
    } else if (tableRef.type === 'LeftRightJoinTable') {
        processLeftRightJoinTable(tableRef, context);
    } else if (tableRef.type === 'TableFactor') {
        processTableFactor(tableRef, context);
    } else {
        console.error("Unknown type of table ref:", tableRef.type, tableRef);
        throw new Error(`Unknown type of table ref: ${tableRef.type}`);
    }
}

function processLeftRightJoinTable(tableFactor, context) {
    // Handle JOINs
    if (tableFactor.left) {
        processTableReference(tableFactor.left, context);
    }
    if (tableFactor.right) {
        processTableReference(tableFactor.right, context);
    }
    if (tableFactor.condition && tableFactor.condition.type === 'OnJoinCondition') {
        extractFiltersFromExpression(tableFactor.condition.value, context);
    }
}

function addTable(props, context) {
    const table = {
        type: 'table',
        columns: [],
        filters: [],
        dependsOn: [],
        ...props
    };

    context.tables.push(table);

    addTableAlias(table, context);
}

function processTableFactor(tableFactorRef, context) {
    const tableFactor = tableFactorRef?.value;

    if (tableFactor.type === 'Identifier') {
        addTable({
            name: tableFactor.value,
            alias: tableFactorRef.alias?.value,
            objRef: tableFactorRef
        }, context);
    } else if (tableFactor.type === 'FunctionCall') {
        addTable({
            name: tableFactor.name || null,
            alias: tableFactorRef.alias?.value,
            type: 'function',
            objRef: tableFactorRef
        }, context);
    } else if (tableFactor.type === 'SubQuery') {
        addTable({
            name: 'Sub Query',
            alias: tableFactorRef.alias?.value,
            type: 'subquery',
            objRef: tableFactorRef
        }, context);

        // Recursively extract tables from subquery
        const subQuery = tableFactor.value;
        if (subQuery && subQuery.from) {
            extractTables(subQuery.from, context);
        }
    }
}

// Helper function to extract columns from various clauses
function extractColumns(parsedJson, context) {
    if (parsedJson.selectItems && Array.isArray(parsedJson.selectItems.value)) {
        parsedJson.selectItems.value.forEach(col => {
            processSelectItem(col, context);
        });
    }

    // WHERE clause
    if (parsedJson.where) {
        extractFiltersFromExpression(parsedJson.where, context);
    }

    // GROUP BY
    if (parsedJson.groupBy && Array.isArray(parsedJson.groupBy.value)) {
        parsedJson.groupBy.value.forEach(item => {
            if (item && item.value) {
                processColumn(item.value, context);
            }
        });
    }

    // ORDER BY
    if (parsedJson.orderBy && Array.isArray(parsedJson.orderBy.value)) {
        parsedJson.orderBy.value.forEach(item => {
            if (item && item.value) {
                processColumn(item.value, context);
            }
        });
    }
}

// Helper function to process each select item
function processSelectItem(col, context) {
    if (!col || !col.type) {
        return;
    }

    if (col.type === 'Identifier') {
        addColumnUsage(col.value, context);
    } else if (col.type === 'FunctionCall' && Array.isArray(col.params)) {
        col.params.forEach(param => {
            if (param && param.type === 'Identifier') {
                addColumnUsage(param.value, context);
            }
        });
    }
}

// Helper function to process individual columns
function processColumn(column, context) {
    if (!column || !column.type) {
        return;
    }

    if (column.type === 'Identifier') {
        addColumnUsage(column.value, context);
    } else if (column.type === 'FunctionCall' && Array.isArray(column.params)) {
        column.params.forEach(param => {
            if (param && param.type === 'Identifier') {
                addColumnUsage(param.value, context);
            }
        });
    }
}

// Helper function to add column usage to tables
function addColumnUsage(columnName, context) {
    if (!columnName) {
        return;
    }

    const [fieldName, tableRef] = getColumnAndTableToAdd(columnName, context);

    if (!tableRef.columns.includes(fieldName)) {
        tableRef.columns.push(fieldName);
    }

    return [fieldName, tableRef];
}

function getColumnAndTableToAdd(columnName, context) {
    columnName = columnName.replace(/\`/g, '');

    if (context.isAliasNeeded && !columnName.includes('.')) {
        throw new Error(`Table alias should be used in column name: ${columnName}`);
    }

    const colSplits = columnName.split('.');
    let tableRef = null;

    if (context.isAliasNeeded) {
        tableRef = context.aliasMap[colSplits[0]];
        if (!tableRef) {
            throw new Error(`"${colSplits[0]}" is not a valid alias for "${columnName}"`);
        }
        columnName = colSplits[1];
    } else {
        tableRef = context.tables[0];
        columnName = colSplits[0];
    }

    return [columnName, tableRef];
}

// Helper function to extract filters from expressions
function extractFiltersFromExpression(expression, context) {
    if (!expression || !expression.type) {
        return;
    }

    if (expression.type === 'ComparisonBooleanPrimary') {
        const filter = parseComparison(expression, context);
        if (filter) {
            addFilter(filter, context);
        }
    } else if (expression.type === 'AndExpression' || expression.type === 'OrExpression') {
        if (expression.left) {
            extractFiltersFromExpression(expression.left, context);
        }
        if (expression.right) {
            extractFiltersFromExpression(expression.right, context);
        }
    }
}

// Helper function to parse comparison expressions
function parseComparison(comparison, context) {
    if (!comparison || !comparison.left || !comparison.operator || !comparison.right) {
        return null;
    }

    const left = comparison.left;
    const right = comparison.right;
    const operator = comparison.operator;

    if (left.type === 'Identifier') {
        const field = left.value;
        let target = null;

        if (right.type === 'FunctionCall') {
            // Example: reporter = currentUser()
            target = {
                type: 'value',
                value: 'FunctionCall'
            };
        } else if (right.type === 'Identifier') {
            // Comparison between two columns
            target = {
                type: 'column',
                table: findTableByAliasOrName(getTableAlias(left.value), context),
                tableAlias: getTableAlias(left.value)
            };
        } else if (right.type === 'PlaceHolder') {
            // Parameter
            target = {
                type: 'param',
                name: right.param || null,
                table: findTableByAliasOrName(getTableAlias(left.value), context),
                tableAlias: getTableAlias(left.value)
            };
            if (right.param) {
                // Parameters are added in the main extractInfo function
            }
        } else if (right.type === 'Number' || right.type === 'String' || right.type === 'Boolean') {
            // Literal value
            target = {
                type: 'value',
                value: right.value || null
            };
        } else if (right.type === 'ExpressionList') {
            // e.g., IN clause
            target = {
                type: 'list',
                values: Array.isArray(right.value) ? right.value.map(v => v.value) : []
            };
        }

        return {
            field: field,
            operator: operator,
            target: target
        };
    } else if (left.type === 'FunctionCall') {
        throw new Error("Unhandled function call");
        // e.g., someFunction(column) = value
        // This can be handled based on specific requirements
        //return null;
    }

    return null;
}

// Helper function to add filter to the appropriate table
function addFilter(filter, context) {
    if (!filter || !filter.field) {
        return;
    }

    const [columnName, tableRef] = addColumnUsage(filter.field, context);

    if (!tableRef.filters.includes(columnName)) {
        tableRef.filters.push(columnName);
    }
}

// Helper function to find table name by alias or name
function findTableByAliasOrName(aliasOrName, context) {
    if (!aliasOrName) {
        return null;
    }
    const table = context.tables.find(t => t.alias === aliasOrName || t.name === aliasOrName);
    if (table) {
        return table.name;
    }
    return null;
}

// Helper function to get table alias from identifier
function getTableAlias(identifier) {
    if (!identifier) {
        return null;
    }
    const parts = identifier.split('.');
    if (parts.length === 2) {
        return parts[0];
    }
    return null;
}

// Helper function to extract parameters from the parsed JSON
function extractParameters(parsedJson, context) {
    if (parsedJson.where) {
        traverseForParameters(parsedJson.where, context);
    }

    if (parsedJson.from && Array.isArray(parsedJson.from.value)) {
        parsedJson.from.value.forEach(tableRef => {
            traverseJoinForParameters(tableRef, context);
        });
    }
}

// Helper function to traverse expressions for parameters
function traverseForParameters(expression, context) {
    if (!expression || !expression.type) {
        return;
    }

    if (expression.type === 'ComparisonBooleanPrimary') {
        if (expression.right && expression.right.type === 'PlaceHolder') {
            context.parameters.push({
                name: expression.right.param || '',
                objRef: expression
            });
        }
    } else if (expression.type === 'AndExpression' || expression.type === 'OrExpression') {
        if (expression.left) {
            traverseForParameters(expression.left, context);
        }
        if (expression.right) {
            traverseForParameters(expression.right, context);
        }
    }
}

// Helper function to traverse joins for parameters
function traverseJoinForParameters(tableRef, context) {
    if (!tableRef || !tableRef.type) {
        return;
    }

    if (tableRef.type === 'TableReference') {
        const tableFactor = tableRef.value;
        if (!tableFactor || !tableFactor.type) {
            return;
        }

        if (tableFactor.type === 'LeftRightJoinTable') {
            if (tableFactor.condition && tableFactor.condition.type === 'OnJoinCondition') {
                traverseForParameters(tableFactor.condition.value, context);
            }
            if (tableFactor.left) {
                traverseJoinForParameters(tableFactor.left, context);
            }
            if (tableFactor.right) {
                traverseJoinForParameters(tableFactor.right, context);
            }
        }
    } else if (tableRef.type === 'LeftRightJoinTable') {
        if (tableRef.condition && tableRef.condition.type === 'OnJoinCondition') {
            traverseForParameters(tableRef.condition.value, context);
        }
        if (tableRef.left) {
            traverseJoinForParameters(tableRef.left, context);
        }
        if (tableRef.right) {
            traverseJoinForParameters(tableRef.right, context);
        }
    }
}
