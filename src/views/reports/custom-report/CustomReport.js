import React, { PureComponent } from 'react';
import QueryEditor from "./QueryEditor";
import ReportViewer from "./ReportViewer";

class CustomReport extends PureComponent {

    constructor(props) {
        super(props);

        const { match: { params: { queryId } } } = props;
        this.state = { queryId };
    }

    generateReport($event) {
        this.queryAvailable = true;
        this.report.generateReport($event.queryModel);
    }

    viewReport = () => {

    }

    render() {
        const { queryId } = this.state;

        return (
            <div>
                <QueryEditor queryId={queryId} onViewReport={this.viewReport} />
                <ReportViewer />
            </div>
        );
    }
}

export default CustomReport;