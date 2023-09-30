import React from 'react';
import { GITHUB_HOME_URL, WebSiteUrl } from 'src/constants/urls';
import { Link } from 'src/controls';

function HelpText() {
    return (<div className="pad-15">
        <section>
            <h2>How to Use the Pivot Report</h2>
            <ul>
                <li>
                    Start by providing a JQL query to filter data from Jira.
                </li>
                <li>
                    Easily customize your report by dragging and dropping fields from the right corner into the Report Fields section.
                </li>
                <li>
                    You have the flexibility to display data as regular rows with grouping or mark specific fields as column groups for a
                    column-based layout.
                </li>
                <li>
                    Utilize Column Groups to organize and present your data in columns, offering a structured view of your information.
                </li>
                <li>
                    Make use of subgroups and filters within column groups to further refine your report's content.
                </li>
                <li>
                    To preview your report, simply click on the preview icon located at the top of the report interface.
                </li>
            </ul>
            <p>To know more about Pivot report, have a look at <Link href={`${WebSiteUrl}/features/reports/pivot`}>documentation</Link></p>
            <p>To report a bug or suggest improvements to the report, visit <Link href={`${GITHUB_HOME_URL}/discussions/329`}>GitHub discussions</Link></p>
            <h2>Upcoming Enhancements</h2>
            <ul>
                <li>
                    The ability to sort the data under each group.
                </li>
                <li>
                    The ability to display totals for each group, offering a more comprehensive view of your data.
                </li>
                <li>
                    Support for utilizing parent, sub-tasks and linked issues, allowing you to explore relationships and dependencies within your data.
                </li>
                <li>
                    Enhanced support for pulling issues based on sprints, in addition to JQL queries, for a more dynamic reporting experience.
                </li>
            </ul>
            <h2>Future Enhancements</h2>
            <ul>
                <li>
                    Enhanced support for adding the Pivot Report as a gadget on your dashboard, providing seamless integration with your Jira
                    workflow.
                </li>
                <li>
                    Exciting new features, including the option to add chart views based on your data, enabling richer data visualization.
                </li>
            </ul>
            <br />
            <div>
                <p>
                    <strong>Please Note:</strong> This report is currently undergoing development and is not yet considered fully operational.
                    We strongly request you to manually validate the output before using it for any business purpose.
                    If you encounter any unexpected errors or if the output does not align with your expectations, we kindly request that
                    you report the issue to us. Your assistance in improving the report's reliability is greatly appreciated.
                </p>

                <p><strong>When reporting issues</strong>, we kindly ask you to provide the following details:</p>

                <ol>
                    <li><strong>Screenshots:</strong> Include screenshots that illustrate the problem or discrepancies you've encountered. Visual aids can significantly assist us in identifying issues.</li>
                    <li><strong>Console Error Logs:</strong> If applicable, please provide any error messages or console logs related to the problem. These logs can offer valuable insights into the root cause of the issue.</li>
                    <li><strong>Custom Fields:</strong> If the issue pertains to specific custom fields, please specify the type of custom fields involved. This information can help us pinpoint and address field-specific challenges more effectively.</li>
                </ol>

                <p>Your feedback and collaboration are instrumental in ensuring the quality and reliability of this report. We appreciate your patience and assistance as we work to enhance its performance.</p>
            </div>
        </section>
    </div>);
}

export default HelpText;