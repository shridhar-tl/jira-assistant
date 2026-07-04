export interface ProjectItem {
    name: string;
    key: string;
    id: number | string;
}

export interface DateRange {
    fromDate?: Date;
    toDate?: Date;
}

export interface FlatWorklogData {
    key: string;
    projectName: string;
    projectKey: string;
    parentkey?: string;
    estimate: number;
    author: string;
    worklog: {
        date: Date;
        yyyyMMdd: number;
        timespent: number;
    };
}

export interface ChartDataset {
    label: string;
    backgroundColor: string | CanvasPattern;
    borderColor: string;
    hoverBackgroundColor?: string | CanvasPattern;
    pointBackgroundColor?: string;
    pointBorderColor?: string;
    data: (number | null)[];
}

export interface ChartState {
    labels: string[];
    datasets: ChartDataset[];
}

export interface ChartColorConfig {
    backgroundColor: string;
    borderColor: string;
    hoverBackgroundColor?: string;
    pointBackgroundColor?: string;
    pointBorderColor?: string;
}
