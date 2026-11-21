import { useConfigureDialog } from './configure-dialog-store';
import JqlDatasourceDialog from './dialogs/JqlDatasourceDialog';
import SprintIssuesDialog from './dialogs/SprintIssuesDialog';
import SprintsDialog from './dialogs/SprintsDialog';
import WorklogsDialog from './dialogs/WorklogsDialog';

export default function DatasourceDialogHost() {
    const pending = useConfigureDialog((s) => s.pending);
    if (!pending) return null;

    const key = `${pending.kind}-${pending.request.datasource.id}`;
    switch (pending.kind) {
        case 'jql':
            return <JqlDatasourceDialog key={key} request={pending.request} />;
        case 'sprint-issues':
            return <SprintIssuesDialog key={key} request={pending.request} />;
        case 'sprints':
            return <SprintsDialog key={key} request={pending.request} />;
        case 'worklogs':
            return <WorklogsDialog key={key} request={pending.request} />;
        default:
            return null;
    }
}
