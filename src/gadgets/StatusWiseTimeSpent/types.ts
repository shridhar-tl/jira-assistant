export interface StatusData {
    [statusName: string]: number;
}

export interface ChangeLogEntry {
    date: number;
    from: string;
    to: string;
}

export interface StatusWiseTicket {
    key: string;
    summary: string;
    status: {
        name: string;
        iconUrl?: string;
    };
    issuetype: {
        name: string;
        iconUrl?: string;
    };
    assignee?: {
        displayName: string;
        avatarUrls?: Record<string, string>;
    };
    reporter?: {
        displayName: string;
        avatarUrls?: Record<string, string>;
    };
    created: string;
    project: {
        key: string;
        name: string;
    };
    parent?: {
        key: string;
        fields?: {
            summary?: string;
        };
    };
    timeestimate?: number;
    aggregatetimeestimate?: number;
    timeoriginalestimate?: number;
    aggregatetimeoriginalestimate?: number;
    statusData: StatusData;
    changelog: ChangeLogEntry[];
    epic?: string;
    storyPoint?: number;
}

export interface StatusInfo {
    name: string;
    iconUrl?: string;
}

export interface ColumnDefinition {
    field: string;
    fieldKey?: string;
    displayText: string;
    type: 'string' | 'number' | 'datetime';
    viewComponent?: React.ComponentType<any>;
    props?: Record<string, any>;
    sortable?: boolean;
    width?: string;
    visible?: boolean;
}

export interface GridSettings {
    displayColumns?: string[];
    groupBy?: Array<string | { field: string; id?: string }>;
    groupFoldable?: boolean;
    sortField?: string;
    isDesc?: boolean;
}

export interface StatusWiseTimeSpentSettings {
    jql?: string;
    gridSettings?: GridSettings;
}

export interface StatusWiseTimeSpentProps {
    jql?: string;
    settings?: GridSettings;
    settingsChanged?: (settings: GridSettings) => void;
    setLoader?: (loading: boolean) => void;
    onAddWorklog?: (ticketKey: string) => void;
}
