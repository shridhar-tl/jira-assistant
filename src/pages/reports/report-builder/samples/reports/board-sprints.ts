import { boardsParameter, chart, col, dateColumn, derivedSource, header, rule, sprintsSource, table, text } from '../builders';
import type { BuilderSampleReport } from '../types';

const sample: BuilderSampleReport = {
    id: 'board-sprints',
    title: 'Sprint calendar of boards',
    description: 'The recent, active and upcoming sprints of the chosen boards with their dates and length in days.',
    category: 'sprints',
    icon: 'fa-calendar-days',
    definition: {
        parameters: [boardsParameter],
        datasources: [
            sprintsSource('ds-sprints', 'Sprints', ['closed', 'active', 'future'], 10),
            derivedSource('ds-ordered', 'OrderedSprints', 'ds-sprints', [
                {
                    type: 'sort',
                    keys: [
                        { expression: 'Field.boardName', direction: 'asc' },
                        { expression: 'IfNull(Field.startDate, \'9999-12-31\')', direction: 'asc' },
                    ],
                },
            ]),
        ],
        components: [
            header('title', 'Sprint calendar', 'h1'),
            text('intro', 'Up to ten sprints of each board. The active sprints are highlighted.'),
            chart('length-chart', 'chart-bar', 'ds-ordered', {
                title: 'Sprint length (days)',
                xAxisField: 'name',
                yAxisField: 'durationDays',
                seriesField: 'boardName',
                aggregation: 'none',
            }),
            table(
                'sprints',
                'ds-ordered',
                [
                    col('name', 'Sprint', { conditionalFormats: [rule('active', 'Field.state == \'active\'', '#dbeafe', '#1e40af', true)] }),
                    col('state', 'State', { width: '90px' }),
                    dateColumn('startDate', 'Start'),
                    dateColumn('endDate', 'End'),
                    dateColumn('completeDate', 'Completed'),
                    col('durationDays', 'Days', { width: '70px', align: 'right' }),
                ],
                { groupBy: 'boardName' },
            ),
        ],
    },
};

export default sample;
