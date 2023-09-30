const formatOptions = [
    { label: 'Default', value: 'DT_DF', props: undefined, type: 'datetime' },
    { label: 'Date only', value: 'DT_DO', props: { dateOnly: true }, type: 'datetime' },
    { label: 'Age in days (words)', value: 'DT_AG', props: { quick: true }, type: 'datetime' },
    { label: 'Age in days (number)', value: 'DT_NM', props: { format: 'num' }, type: 'datetime' },

    { label: 'Issue Key with Status', value: 'PT_KY_ST', props: { settings: { showStatus: true } }, type: 'parent' },
    { label: 'Issue Key only', value: 'PT_KY', props: { settings: { showStatus: false } }, type: 'parent' },
    { label: 'Summary only', value: 'PT_SM', props: { settings: { valueType: 'summary', showStatus: false } }, type: 'parent' },
    { label: 'Summary with Status', value: 'PT_SM_ST', props: { settings: { valueType: 'summary', showStatus: true } }, type: 'parent' },
    { label: 'Both Key & Summary', value: 'PT_BT', props: { settings: { valueType: 'both', showStatus: false } }, type: 'parent' },
    { label: 'Key, Summary & Status', value: 'PT_BT_ST', props: { settings: { valueType: 'both', showStatus: true } }, type: 'parent' },

    { label: 'Key only', value: 'PR_KY', props: { settings: {} }, type: 'project' },
    { label: 'Name only', value: 'PR_NM', props: { settings: { valueType: 'name' } }, type: 'project' },
    { label: 'Both Key & Name', value: 'PR_BT', props: { settings: { valueType: 'both' } }, type: 'project' },

    { label: 'Formatted', value: 'TS_FR', props: { format: true }, type: 'timespent' },
    { label: 'As Number', value: 'TS_NM', props: { format: false }, type: 'timespent' },

    { label: 'Name only', value: 'USR_NM', props: { settings: { showImage: false } }, type: 'user' },
    { label: 'Name with Image', value: 'USR_NM_IMG', props: { settings: { showImage: true } }, type: 'user' },
    { label: 'Email only', value: 'USR_EM', props: { settings: { valueType: 'email', showImage: false } }, type: 'user' },
    { label: 'Email with Image', value: 'USR_EM_IMG', props: { settings: { valueType: 'email', showImage: true } }, type: 'user' },
    { label: 'Name & Email', value: 'USR_BT', props: { settings: { valueType: 'both', showImage: false } }, type: 'user' },
    { label: 'Name, Email & Image', value: 'USR_BT_IMG', props: { settings: { valueType: 'both', showImage: true } }, type: 'user' }
];

export const valuePropsMap = formatOptions.reduce((map, cur) => {
    map[cur.value] = cur.props;
    return map;
}, {});

export const typeFormatMap = formatOptions.groupBy(f => f.type).reduce((map, { key, values }) => {
    map[key] = values;
    return map;
}, {});

typeFormatMap['date'] = typeFormatMap['datetime'];
