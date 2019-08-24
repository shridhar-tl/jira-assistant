import React, { PureComponent } from 'react';

class CustomReport extends PureComponent {

    constructor(props) {
        super(props);

        this.route.params.subscribe(params => {
            const queryId = parseInt(params['queryId'] || 0) || null;
            if (queryId) {
                this.reportEditor.selQueryId = queryId;
                this.reportEditor.queryChanged();
            }
        });
    }

    generateReport($event) {
        this.queryAvailable = true;
        this.report.generateReport($event.queryModel);
    }

    render() {
        return (
            <div>

            </div>
        );
    }
}

export default CustomReport;