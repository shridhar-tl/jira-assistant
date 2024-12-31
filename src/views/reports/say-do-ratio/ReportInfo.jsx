import React from 'react';
import { isPluginBuild } from 'src/constants/build-info';

function HelpText() {
    return (
        <div className="pad-15">
            <section>
                <h2>How to Use the Say Do Ratio Report</h2>
                <ul>
                    <li>
                        Say Do Ratio Report serves as a valuable tool to summarize achievements within each sprint and to monitor progress sprint over sprint.
                    </li>
                    <li>
                        Begin by selecting your filters and configuration options. Click on the <span className="fa fa-edit" /> icon located at the top right corner of the report to access report config:
                        <ul>
                            <li><strong>Select Sprint Boards:</strong> Choose all sprint boards for which you wish to view the report.</li>
                            <li><strong>Number of Sprints to Display:</strong> Specify the number of completed sprints you would like to include in the report. The minimum allowed is <strong>3</strong>.</li>
                            <li><strong>Number of Sprints for Velocity:</strong> Indicate the number of sprints to be used for velocity calculations (min <strong>3</strong>, max <strong>9</strong>).</li>
                            <li><strong>Include Non-Working Days in Cycle Time Calculation:</strong> Decide if you want to include non-working days based on your General settings.</li>
                        </ul>
                    </li>
                    <li>
                        Once all configurations are set, click the <strong>"Generate Report"</strong> button to produce the report.
                        Be prepared for potential delays based on the number of boards and sprints selected.
                    </li>
                </ul>
                <p>
                    <strong>Report Structure:</strong>
                    This report displays a comprehensive table summarizing all boards and sprints, along with individual charts for each board.
                    This report supports exporting data in <strong>Excel</strong>, <strong>PDF</strong>, and <strong>CSV</strong> formats.
                    User feedback for suggestions and bug reports is appreciated to enhance this report.
                </p>
                <p>
                    <strong>Table Structure:</strong>
                    The report table contains the following columns:
                    <ul>
                        <li><strong>Board Name:</strong> Name of the selected board.</li>
                        <li><strong>Velocity:</strong> Expected velocity for the upcoming sprint based on completed story points.</li>
                        <li><strong>Say-Do Ratio:</strong> Average Say-Do Ratio for the sprints included in the report.</li>
                        <li><strong>Cycle Time:</strong> Average cycle time calculated using specific configurations.</li>
                        <li><strong>Sprints:</strong> Each sprint is represented in individual columns, showing the average Say-Do Ratio for that sprint.</li>
                    </ul>
                </p>

                <div>
                    <p>
                        <strong>Important Note:</strong>
                    </p>
                    <ul>
                        {!isPluginBuild && <li> This report requires access to change logs and utilizes a new API introduced by Jira, currently available only to Jira Cloud users. It is still in preview and not yet rolled out to all the Jira Instances.</li>}
                        {isPluginBuild && <li>This report requires access to change logs and utilizes a new API introduced by Jira, which is still in preview and not yet rolled out to all the Jira Instances.</li>}
                        <li>As it uses some of the API's which are still in preview, this report may not be functional for all Jira Instances immediately. Hence if it does not work then wait for few days so that your region gets the update from Jira.</li>
                        <li>While there are no APIs to retrieve information about stories that were part of a sprint at its initiation, accurate calculation of the
                            Say-Do Ratio can be challenging if a story is removed during the sprint.
                            {!isPluginBuild && <> A workaround is implemented by using some of the Jira's internal API's, which is not available while you use oAuth authentication.</>}
                            {isPluginBuild && <> A workaround is implemented for upcoming sprints, but results for sprints that have already begun may not be precise.</>}
                        </li>
                        {!isPluginBuild && <li>Using the report with oAuth have lack of functionalities due to the above mentioned limitations.</li>}
                    </ul>
                </div>
            </section>
        </div>
    );
}

export default HelpText;
