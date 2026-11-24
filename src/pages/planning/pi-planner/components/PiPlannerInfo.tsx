import { ReportInfoNote, ReportInfoSection } from '@/gadgets/shared';

import { articleTerm, lowerTerm, type TermSet } from '../terminology';

interface PiPlannerInfoProps {
    terms: TermSet;
}

export default function PiPlannerInfo({ terms }: PiPlannerInfoProps) {
    const plan = lowerTerm(terms.plan);
    const feature = lowerTerm(terms.feature);
    const features = lowerTerm(terms.features);
    const iteration = lowerTerm(terms.iteration);

    const program = lowerTerm(terms.program);
    const gettingStarted = [
        <>
            Create {articleTerm(terms.program)} (<i className="fa fa-plus" /> next to the {program} selector) and add the boards of its {lowerTerm(terms.teams)}. Each board is one
            team. The selector at the top switches between {lowerTerm(terms.programs)} and is remembered.
        </>,
        <>
            Create a {plan} of the {program} with a name and dates. It starts with the {lowerTerm(terms.teams)} of the {program}, and you can add or remove some for this {plan}.
        </>,
        <>
            <strong>Match by dates</strong> picks the sprints of each team that fall in the {plan}. Adjust them per team if needed, and mark the last {iteration} as the{' '}
            {lowerTerm(terms.ipIteration)} when you use one.
        </>,
        `A new ${plan} can copy the teams of an earlier one.`,
        <>
            Program settings (<i className="fa fa-cog" />) choose the terminology, how columns line up, where objectives and risks are stored, which issue types are {features}, which
            link type is a dependency, and who can change {lowerTerm(terms.plans)}.
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
        <>
            <strong>Raise dependency</strong> records what one team needs from another, even before a Jira issue exists. The other team can be in this {plan}, in another {program}{' '}
            (a cross-{program} dependency) or any board. Set the date it is needed by and tag the stories that wait for it.
        </>,
        `The delivering team sees the dependency in its own ${plan}, commits to a date or declines it, and tags the stories that deliver it. Their progress shows how far the dependency is, and it counts as delivered when they are done.`,
        'A dependency is late after its date, and at risk when it is not answered two weeks before, or committed or forecast after the date it is needed by.',
        `A dependency can also be raised as a ${lowerTerm(terms.risk)} with what goes wrong if it is late.`,
        'The matrix shows which team waits on which, coloured by the worst state between them. Select a cell to see those items.',
        'Issue links of the configured link type and of any "blocks" or "depends on" link type are dependencies too. Lines on the board connect dependent features, red lines are conflicts. An issue link between two teams can be raised as a team dependency.',
        'A conflict means the blocker is planned in the same or a later sprint than the issue it blocks, or in no sprint.',
        <>
            The Dependencies view lists every dependency with filters for conflicts and cross-team ones. <strong>Add dependency</strong> links any two issues, also issues outside
            this {plan}.
        </>,
        <>
            <strong>Check other {lowerTerm(terms.plans)}</strong> looks up the issues outside this {plan} in one request and shows the team, sprint and {plan} they are planned in,
            so dependencies on other programs are compared by sprint dates.
        </>,
    ];

    const objectives = [
        `${terms.objectives} are kept per team and for the whole program, as ${lowerTerm(terms.committed)} or ${lowerTerm(terms.uncommitted)}, with planned and actual ${lowerTerm(terms.value)} (1–10) and linked issues.`,
        `Predictability is the actual ${lowerTerm(terms.value)} of committed ${lowerTerm(terms.objectives)} divided by their planned ${lowerTerm(terms.value)}.`,
        `${terms.objectives} link to issues. An epic may span several ${lowerTerm(terms.plans)}, so it stands only for its stories in the sprints of the ${plan}. Stories done before the ${plan} started or not in its sprints are left out, and its open stories outside the ${plan} are shown as a count. Progress follows the stories as they are done, measured in story points, hours or issue count. The health compares the progress with the time gone and the sprints the open work is planned in.`,
        `${terms.risks} have an owner, a team, linked issues, what goes wrong if they happen, a date to resolve them by and a status (${Object.values(terms.roam).join(', ')}). Overdue ${lowerTerm(terms.risks)} are highlighted.`,
        `A ${lowerTerm(terms.risk)} can be raised on another team, also of another ${program}. That team accepts or declines it from its own ${plan}, and anyone who can edit that ${plan} can answer.`,
        `${terms.objectives} and ${lowerTerm(terms.risks)} can be stored as Jira issues of a chosen type in the settings, so they can be searched in Jira.`,
        `${terms.confidence} votes (1–5) are recorded per team and for the program and kept as a history. Custom key dates and the releases of the teams' projects are shown on the board.`,
    ];

    const summary = [
        `Summary shows the time gone against the work finished, what needs attention and what goes well, a burn-up by ${iteration}, the progress of each team, capacity use, ${lowerTerm(terms.objectives)} and ${lowerTerm(terms.risks)}.`,
        `The summary of ${articleTerm(terms.program)} shows each team of the ${plan} in progress with its progress, blockers, ${lowerTerm(terms.risks)}, ${lowerTerm(terms.objectives)} and ${lowerTerm(terms.confidence)}, and its open cross-${program} dependencies.`,
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
            <ReportInfoSection title={`${terms.objectives}, ${lowerTerm(terms.risks)} and ${lowerTerm(terms.confidence)}`} icon="fa-bullseye" items={objectives} />
            <ReportInfoSection title="Summary and export" icon="fa-file-lines" items={summary} />
            <ReportInfoNote title="Where the data is kept:">
                {terms.programs}, {lowerTerm(terms.plans)}, {lowerTerm(terms.objectives)}, {lowerTerm(terms.risks)}, team dependencies and votes are stored in the Jira Assistant app on this site. Story moves and dependencies
                are written to Jira.
            </ReportInfoNote>
        </div>
    );
}
