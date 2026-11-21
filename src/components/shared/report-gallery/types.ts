export interface ReportSample<TDefinition, TCategory extends string = string> {
    id: string;
    title: string;
    description: string;
    category: TCategory;
    icon: string;
    definition: TDefinition;
}

export interface ReportSampleCategory<TCategory extends string = string> {
    id: TCategory;
    label: string;
    icon: string;
}

export type ReportTagTone = 'default' | 'info' | 'warning';

export interface ReportTag {
    icon: string;
    label: string;
    title?: string;
    tone?: ReportTagTone;
}

export interface SavedReportItem {
    id: number;
    name: string;
    dateCreated?: Date | string;
    dateUpdated?: Date | string;
    tags: ReportTag[];
}

export interface SampleReportItem {
    id: string;
    title: string;
    description: string;
    category: string;
    icon: string;
    tags: ReportTag[];
}
