import React, { PureComponent } from 'react';
import QueryEditor from "./QueryEditor";
import ReportViewer from "./ReportViewer";
import "./Common.scss";

class CustomReport extends PureComponent {

    constructor(props) {
        super(props);

        const { match: { params: { reportId } } } = props;
        this.state = { reportId };
    }

    generateReport($event) {
        this.queryAvailable = true;
        this.report.generateReport($event.queryModel);
    }

    viewReport = (reportDefinition) => {
        this.setState({ viewReport: true, reportDefinition });
    }

    queryChanged = (qry) => {
        // nothing to do
    }

    render() {
        const { reportId, viewReport, reportDefinition } = this.state;

        return (
            <div className="custom-report">
                <QueryEditor reportId={reportId} onViewReport={this.viewReport} onChange={this.queryChanged} />
                {viewReport && reportDefinition && <ReportViewer key={reportDefinition._uniqueId} isGadget={false} definition={reportDefinition} />}
            </div>
        );
    }
}

export default CustomReport;