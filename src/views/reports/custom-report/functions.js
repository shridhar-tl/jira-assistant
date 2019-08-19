export const functions = [
    { name: 'formatDate', returns: 'string', text: 'Format Date', description: '', types: ['date', 'datetime'] },
    { name: 'formatDateTime', returns: 'string', text: 'Format Date & time', description: '', types: ['datetime', 'date'] },
    { name: 'formatTime', returns: 'string', text: 'Format Time', description: '', types: ['datetime'] },
    { name: 'formatDateTime?1', returns: 'string', text: 'Custom Format', description: '', types: ['datetime', 'date'] },
    { name: '', text: 'No formatting', description: '', types: ['string', 'number', 'datetime', 'date', 'seconds'] },
    { name: 'sum?0', returns: 'number', text: 'Sum values', description: '', types: ['number'], forArray: true },
    { name: 'min?0', returns: 'number', text: 'Min of values', description: '', types: ['number'], forArray: true },
    { name: 'max?0', returns: 'number', text: 'Max of values', description: '', types: ['number'], forArray: true },
    { name: 'avg?0', returns: 'number', text: 'Average of values', description: '', types: ['number'], forArray: true },
    { name: 'count?0', returns: 'number', text: 'Count of values', description: '', types: ['*'], forArray: true },
    { name: 'count?1', returns: 'number', text: 'Count of distinct values', description: '', types: ['number', 'datetime', 'date'], forArray: true },
    { name: 'sum?1', returns: 'number', text: 'Sum of group', description: '', types: ['number'], aggregate: true, header: 'Sum of {0}' },
    { name: 'min?1', returns: 'number', text: 'Min of group', description: '', types: ['number'], aggregate: true, header: 'Min of {0}' },
    { name: 'max?1', returns: 'number', text: 'Max of group', description: '', types: ['number'], aggregate: true, header: 'Max of {0}' },
    { name: 'avg?1', returns: 'number', text: 'Average of group', description: '', types: ['number'], aggregate: true, header: 'Average of {0}' },
    { name: 'count?2', returns: 'number', text: 'Count of group', description: '', types: ['*', '!worklog'], aggregate: true, header: 'Count of {0}' },
    { name: 'count?3', returns: 'number', text: 'Count of distinct values', description: '', types: ['number', 'datetime', 'date'], aggregate: true, header: 'Count of distinct {0}' },
    { name: 'first', returns: 'number', text: 'First', description: '', types: ['*'], forArray: true },
    { name: 'last', returns: 'number', text: 'Last', description: '', types: ['*'], forArray: true },
    {
        name: 'propOfNthItem?0', returns: 'string', text: 'Name of First Item', description: '', types: ['object'], forArray: true,
        params: [{ value: 0 }, { value: "name" }]
    },
    {
        name: 'propOfNthItem?1', returns: 'string', text: 'Name of Last Item', description: '', types: ['object'], forArray: true,
        params: [{ value: "last" }, { value: "name" }]
    },
    {
        name: 'propOfNthItem?2', returns: 'string', text: 'Name of First Item (from csv)', description: '', types: ["string"], forArray: true,
        params: [{ value: 0 }, { value: "name" }, { value: true }]
    },
    {
        name: 'propOfNthItem?3', returns: 'string', text: 'Name of Last Item (from csv)', description: '', types: ["string"], forArray: true,
        params: [{ value: "last" }, { value: "name" }, { value: true }]
    },
    //{
    //  name: 'parseWorklog?0', returns: 'string', text: 'Userwise Worklog', description: 'Display worklog for userwise', types: ['worklog'], forArray: true, params: [{
    //    type: "columnHeader"
    //  }]
    //},
    { name: 'format?1', returns: 'number', text: 'Two Decimals', description: '', types: ['number'] },
    { name: 'format?2', returns: 'number', text: 'No Decimals', description: '', types: ['number'] },
    { name: 'format?3', returns: 'number', text: 'Currency', description: '', types: ['number'] },
    { name: 'formatSecs?1', returns: 'string', text: 'Sum & Format Seconds (hours)', description: 'Format seconds and show in hours, mins and secs', aggregate: true, types: ['seconds', 'number'] },
    { name: 'formatSecs?0', returns: 'string', text: 'Format Seconds (hours)', description: 'Format seconds and show in hours, mins and secs', types: ['seconds', 'number'] },
    { name: 'formatDays?0', returns: 'string', text: 'Format Seconds (days)', description: 'Format seconds and show in days, hours, mins and secs', types: ['seconds', 'number'] },
    { name: 'convertSecs?0', returns: 'number', text: 'Convert Seconds (hours)', description: 'Convert seconds into hours', types: ['seconds', 'number'] },
    { name: 'convertSecs?0', returns: 'number', text: 'Time spent (hours)', description: 'Display worklog in hours', types: ['worklog'] },
    { name: 'formatSecs?0', returns: 'number', text: 'Format Time spent (hours)', description: 'Display worklog in hours', types: ['worklog'] },
    { name: 'formatUser?1', returns: 'string', text: 'User Display Name', description: '', types: ['user'], params: [{ value: "DN" }] },
    { name: 'formatUser?2', returns: 'string', text: 'User Email', description: '', types: ['user'], params: [{ value: "EM" }] },
    { name: 'formatUser?3', returns: 'string', text: 'User Login', description: '', types: ['user'], params: [{ value: "LG" }] },
    { name: 'formatUser?4', returns: 'string', text: 'User Display Name & Email', description: '', types: ['user'], params: [{ value: "NE" }] },
    { name: 'formatUser?5', returns: 'string', text: 'User Display Name & Login', description: '', types: ['user'], params: [{ value: "NL" }] },
    {
        name: 'getProperty?0', returns: 'string', text: 'Get name value', description: '', types: ['object'], params: [{
            type: "string",
            display: "Property Name:",
            //required: true,
            value: "name"
        }]
    },
    {
        name: 'getProperty?1', returns: 'string', text: 'Get property value (string)', description: '', types: ['object'],
        params: [{
            type: "string",
            display: "Property Name:",
            //required: true,
            default: "name",
            prompt: true
        }]
    },
    { name: 'getProperty?2', returns: 'number', text: 'Get property value (number)', description: '', types: ['object'] },
    { name: 'getProperty?3', returns: 'datetime', text: 'Get property value (datetime)', description: '', types: ['object'] },
    { name: 'convertToNumber', returns: 'number', text: 'Try convert to number', description: '', types: ['string'] },
    { name: 'objFromCSV?1', returns: 'object', text: 'Object from CSV', description: '', types: ['string'] },
    { name: 'objFromCSV?2', returns: 'object', text: 'Name from CSV', description: '', types: ['string'] },
];
export const defaultFunctions = {
    date: 'formatDate',
    datetime: 'formatDateTime',
    number: '',
    user: 'formatUser?1',
    string: '',
    object: 'getProperty?0',
    seconds: 'formatSecs?0',
    worklog: 'convertSecs?0'
};
