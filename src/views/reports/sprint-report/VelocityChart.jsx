import React, { PureComponent } from 'react';
import { Chart } from 'primereact/chart';

const lineChartColours = [
    {
        backgroundColor: '#f1c40f4a',
        borderColor: '#f1c40f',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(148,159,177,0.8)'
    },
    {
        backgroundColor: '#27ae614a',
        borderColor: '#27ae61',
        pointBackgroundColor: 'rgba(77,83,96,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(77,83,96,1)'
    },
    {
        backgroundColor: '#e84c3d4a',
        borderColor: '#e84c3d',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(148,159,177,0.8)'
    },
    {
        backgroundColor: '#8f44ad4a',
        borderColor: '#8f44ad',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(148,159,177,0.8)'
    },
    {
        backgroundColor: '#9a8d2f4a',
        borderColor: '#9a8d2f',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(148,159,177,0.8)'
    },
    {
        backgroundColor: 'rgba(148,159,177,0.2)',
        borderColor: 'rgba(148,159,177,1)',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(148,159,177,0.8)'
    }
];

const chartOptions = {
    animation: false,
    responsive: true
};

class VelocityChart extends PureComponent {
    constructor(props) {
        super(props);

        this.state = this.generateChartData();
    }

    UNSAFE_componentWillReceiveProps(props) {
        if (props.sprintDetails) {
            this.generateChartData();
        }
    }

    generateChartData() {
        const sprintLabels = [];
        const arrEstimated = [];
        const arrCompleted = [];
        const arrIncomplete = [];
        const arrTotal = [];
        const arrAdded = [];
        const arrRemoved = [];

        this.props.sprintDetails
            .orderBy(sprint => sprint.sprint.id)
            .forEach((sprint) => {
                sprintLabels.push(sprint.sprint.name);

                arrEstimated.push(sprint.estimateIssuesSP);
                arrCompleted.push(sprint.completedSP);
                arrIncomplete.push(sprint.incompletedSP || 0);
                arrTotal.push(sprint.totalIssuesSP || 0);
                arrAdded.push(sprint.addedSP || 0);
                arrRemoved.push(sprint.removedSP || 0);
            });

        const datasets = [
            { data: arrEstimated, label: 'Estimated', ...lineChartColours[0] },
            { data: arrCompleted, label: 'Completed', ...lineChartColours[1] },
            { data: arrIncomplete, label: 'Not completed', ...lineChartColours[2] },
            { data: arrTotal, label: 'Total', ...lineChartColours[3] },
            { data: arrAdded, label: 'Added to sprint', ...lineChartColours[4] },
            { data: arrRemoved, label: 'Removed from sprint', ...lineChartColours[5] }
        ];

        return { chartData: { labels: sprintLabels, datasets } };
    }

    render() {
        const { chartData } = this.state;

        return (
            <div>
                <Chart type="line" data={chartData} options={chartOptions} />
            </div>
        );
    }
}

export default VelocityChart;