export const projectsJql = 'project in parameters(\'Projects\')';
export const openIssuesJql = 'statusCategory != Done';
export const worklogPeriodJql = 'worklogDate >= startDate(parameters(\'Period\')) AND worklogDate <= endDate(parameters(\'Period\'))';
