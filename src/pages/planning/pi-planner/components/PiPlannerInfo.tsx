import { ReportInfoNote, ReportInfoSection } from '@/gadgets/shared';

import type { TermSet } from '../terminology';

interface PiPlannerInfoProps {
    terms: TermSet;
}

export default function PiPlannerInfo({ terms }: PiPlannerInfoProps) {
    const plan = terms.plan.toLowerCase();
    const feature = terms.feature.toLowerCase();
    const features = terms.features.toLowerCase();
    const iteration = terms.iteration.toLowerCase();

    const gettingStarted = [
        <>
            Create a {plan} with a name, dates and the boards of the {terms.teams.toLowerCase()}. Each board is one team.
        </>,
        <>
            <strong>Match by dates</strong> picks the sprints of each team that fall in the {plan}. Adjust them per team if needed, and mark the last {iteration} as the{' '}
            {terms.ipIteration.toLowerCase()} when you use one.
        </>,
        `A new ${plan} can copy the teams of an earlier one.`,
        <>
            Program settings (<i className="fa fa-cog" />) choose the terminology, how columns line up, where objectives and risks are stored, which issue types are {features}, which
            link type is a dependency, and who can change {terms.plans.toLowerCase()}.
        </>,
    ];

    const board = [
        `Rows are teams and columns are ${iteration}s. A ${feature} appears in every cell that holds its stories, with the count and estimate of those stories.`,
        `Teams with different sprint lengths are lined up by date: each sprint goes into the ${iteration} it overlaps most. Switch to each team's own sprints in the settings.`,
        `Each cell shows the planned estimate against the team's capacity for that ${iteration}, including leave from imported .ics calendars.`,
        <>
            Drag a {feature} to a team and {iteration} to move its not-done stories of that team into the team's sprint. A preview lists the stories first and you can untick some.
            Done stories never move. The <i className="fa fa-arrows" /> button does the same without dragging.
        </>,
        `Stories that are in no sprint of the ${plan} are in the last column of their team, so missing breakdown is visible.`,
        `${terms.features} not planned anywhere are listed on the right. Drag them onto the board or use the plan button. Drag the divider to resize the list.`,
    ];

    const roughPlanning = [
        `A ${feature} without stories can still be placed in a team and ${iteration} with a rough estimate. It counts against the team's capacity.`,
        `Once the ${feature} has stories, the board shows it where its stories are and the rough placement is removed.`,
    ];

    const dependencies = [
        'Dependencies are Jira issue links of the chosen link type. Lines on the board connect dependent features, red lines are conflicts.',
        'A conflict means the blocker is planned in the same or a later sprint than the issue it blocks, or in no sprint.',
        <>
            The Dependencies view lists every dependency with filters for conflicts and cross-team ones. <strong>Add dependency</strong> links any two issues, also issues outside
            this {plan}.
        </>,
        <>
            <strong>Check other {terms.plans.toLowerCase()}</strong> looks up the issues outside this {plan} in one request and shows the team, sprint and {plan} they are planned in,
            so dependencies on other programs are compared by sprint dates.
        </>,
    ];

    const objectives = [
        `${terms.objectives} are kept per team and for the whole program, as ${terms.committed.toLowerCase()} or ${terms.uncommitted.toLowerCase()}, with planned and actual ${terms.value.toLowerCase()} (1–10) and linked issues.`,
        `Predictability is the actual ${terms.value.toLowerCase()} of committed ${terms.objectives.toLowerCase()} divided by their planned ${terms.value.toLowerCase()}.`,
        `${terms.risks} have an owner, a team, linked issues and a status (${Object.values(terms.roam).join(', ')}).`,
        `${terms.objectives} and ${terms.risks.toLowerCase()} can be stored as Jira issues of a chosen type in the settings, so they can be searched in Jira.`,
        `${terms.confidence} votes (1–5) are recorded per team and for the program and kept as a history. Custom key dates and the releases of the teams' projects are shown on the board.`,
    ];

    const summary = [
        `Summary shows scope, capacity use and progress per team and ${iteration}, dependency conflicts, ${terms.objectives.toLowerCase()} with ${terms.value.toLowerCase()} and ${terms.risks.toLowerCase()} by status.`,
        <>
            <i className="fa fa-download" /> exports the current view to Excel.
        </>,
    ];

    return (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4">
            <ReportInfoSection title="Getting started" icon="fa-info-circle" items={gettingStarted} defaultOpen />
            <ReportInfoSection title="Program board" icon="fa-th" items={board} />
            <ReportInfoSection title={`${terms.features} without stories`} icon="fa-pencil" items={roughPlanning} />
            <ReportInfoSection title="Dependencies" icon="fa-link" items={dependencies} />
            <ReportInfoSection title={`${terms.objectives}, ${terms.risks.toLowerCase()} and ${terms.confidence.toLowerCase()}`} icon="fa-bullseye" items={objectives} />
            <ReportInfoSection title="Summary and export" icon="fa-file-lines" items={summary} />
            <ReportInfoNote title="Where the data is kept:">
                {terms.plans}, {terms.objectives.toLowerCase()}, {terms.risks.toLowerCase()} and votes are stored in the Jira Assistant app on this site. Story moves and dependencies
                are written to Jira.
            </ReportInfoNote>
        </div>
    );
}
