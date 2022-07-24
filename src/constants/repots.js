export const OPERATORS = [
    { value: '{0} = {1}', label: 'Equals value' },
    { value: '{0} != {1}', label: 'Not equals value' },
    { value: '{0} > {1}', label: 'greater than', types: ['number', 'date', 'datetime', 'seconds'] },
    { value: '{0} >= {1}', label: 'greater than or equals', types: ['number', 'date', 'datetime', 'seconds'] },
    { value: '{0} < {1}', label: 'lesser than', types: ['number', 'date', 'datetime', 'seconds'] },
    { value: '{0} <= {1}', label: 'lesser than or equals', types: ['number', 'date', 'datetime', 'seconds'] },
    { value: '({0} >= {1} AND {0} <= {2})', label: 'between', types: ['number', 'date', 'datetime', 'seconds'], type: 'range' },
    { value: '({0} < {1} AND {0} > {2})', label: 'not between', types: ['number', 'date', 'datetime', 'seconds'], type: 'range' },
    { value: '{0} in ({1})', label: 'Contains any of', type: 'multiple' },
    { value: '{0} not in ({1})', label: 'Does not contain', type: 'multiple' }
];
