export const paramsFunctionName = 'parameters';

const allowedFunctions = [
    {
        name: paramsFunctionName,
        parameters: [
            {
                paramName: 'paramName',
                type: 'string'
            }
        ],
        returns: ['any']
    },
    {
        name: 'sum',
        parameters: [
            {
                paramName: 'values',
                type: ['number', 'timespent'],
                array: true
            }
        ],
        returns: ':values'
    },
    {
        name: 'avg',
        parameters: [
            {
                paramName: 'values',
                type: ['number', 'timespent'],
                array: true
            }
        ],
        returns: ':values'
    },
    {
        name: 'min',
        parameters: [
            {
                paramName: 'values',
                type: ['number', 'timespent', 'date', 'datetime'],
                array: true
            }
        ],
        returns: ':values'
    },
    {
        name: 'max',
        parameters: [
            {
                paramName: 'values',
                type: ['number', 'timespent', 'date', 'datetime'],
                array: true
            }
        ],
        returns: ':values'
    },
    {
        name: 'first',
        parameters: [
            {
                paramName: 'values',
                array: true
            }
        ],
        returns: ':values'
    },
    {
        name: 'last',
        parameters: [
            {
                paramName: 'values',
                array: true
            }
        ],
        returns: ':values'
    },
    {
        name: 'as_date',
        parameters: [
            {
                paramName: 'value',
                type: ['number', 'date', 'datetime', 'string'],
            },
            {
                paramName: 'format',
                type: ['string'],
                optional: true
            }
        ],
        returns: 'datetime'
    },
    {
        name: 'today',
        parameters: [
            {
                paramName: 'value',
                type: ['number', 'string'],
                optional: true
            }
        ],
        returns: 'datetime'
    },
    {
        name: 'eod',
        parameters: [
            {
                paramName: 'value',
                type: ['datetime', 'number', 'string'],
                optional: true
            }
        ],
        returns: 'datetime'
    },
    {
        name: 'startOfDay',
        parameters: [
            {
                paramName: 'value',
                type: ['datetime', 'number', 'string'],
                optional: true
            }
        ],
        returns: 'datetime'
    },
    {
        name: 'now',
        parameters: [
            {
                paramName: 'value',
                type: ['number', 'string'],
                optional: true
            }
        ],
        returns: 'datetime'
    },
    {
        name: 'date_diff',
        parameters: [
            {
                paramName: 'date1',
                type: 'datetime'
            },
            {
                paramName: 'date2',
                type: 'datetime'
            },
            {
                paramName: 'unit',
                type: 'string',
                optional: true
            }
        ],
        returns: 'number'
    },
    {
        name: 'startDate',
        parameters: [
            {
                paramName: 'date',
                type: 'daterange'
            }
        ],
        returns: 'datetime'
    },
    {
        name: 'endDate',
        parameters: [
            {
                paramName: 'date',
                type: 'daterange'
            }
        ],
        returns: 'datetime'
    },
    {
        name: 'currentUser',
        parameters: [],
        returns: 'user'
    },
];

export const allowedFunctionsMap = allowedFunctions.reduce((obj, func) => {
    obj[func.name.toLowerCase()] = func;

    return obj;
}, {});
