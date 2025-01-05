import React from 'react';
import QueryBlock from './QueryBlock';
import { generateReport } from './query-processing/generate';
import './QueryReport.scss';

function QueryReport() {
    return (
        <div className="query-report">
            <div className="query-report__header">
                <h2 className="query-report__title">Query Report</h2>
                <span className="fas fa-sync-alt query-report__refresh" title="Refresh" />
            </div>
            <QueryBlock onExecute={generateReport} />
            <QueryResult />
        </div>
    );
}

export default QueryReport;

function QueryResult() {
    return (<div className="query-report__table">
        {/* Placeholder for table data */}
        <table>
            <thead>
                <tr>
                    <th>Field 1</th>
                    <th>Field 2</th>
                    <th>Field 3</th>
                </tr>
            </thead>
            <tbody>
                {/* Data rows go here */}
            </tbody>
        </table>
    </div>);
}