const sampleSubReportPrefix = 'sample:';

export function sampleSubReportId(sampleId: string, key: string): string {
    return `${sampleSubReportPrefix}${sampleId}/${key}`;
}

export function isSampleSubReportId(subReportId: string): boolean {
    return subReportId.startsWith(sampleSubReportPrefix);
}

export function parseSampleSubReportId(subReportId: string): { sampleId: string; key: string } | undefined {
    if (!isSampleSubReportId(subReportId)) return undefined;
    const [sampleId, key] = subReportId.slice(sampleSubReportPrefix.length).split('/');
    return sampleId && key ? { sampleId, key } : undefined;
}
