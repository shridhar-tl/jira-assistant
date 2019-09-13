import React from 'react';
import { inject } from '../services/injector-service';
import { ScrollableTable, THead, TBody, Column, NoDataRow } from '../components/ScrollableTable';
import BaseGadget from './BaseGadget';
import { Button, TextBox, Checkbox } from '../controls';
import BaseDialog from "../dialogs/BaseDialog";
import Dialog from '../dialogs';

class MyReports extends BaseGadget {
    constructor(props) {
        super(props, 'My Reports', 'fa-filter');
        inject(this, "ReportService", "MessageService", "UserUtils");
        this.state.isLoading = true;
    }

    UNSAFE_componentWillMount() {
        this.refreshData();
    }

    refreshData = () => {
        this.setState({ isLoading: true });

        this.$report.getReportsList()
            .then((result) => {
                const { selAllChk } = this.state;

                result.forEach(r => {
                    r.selected = selAllChk;
                    r.displayDate = this.$userutils.formatDateTime(r.dateCreated);
                    r.sortDate = r.dateCreated.getTime();
                });

                this.setState({ reportsList: result, isLoading: false });
            });
    }

    deleteSelectedReports = () => {
        const ids = this.state.reportsList.filter((w) => w.selected).map((w) => w.id);
        if (ids.length === 0) {
            this.$message.info("Select the reports to be deleted!");
            return;
        }


        Dialog.confirmDelete("Are you sure to delete the selected report(s)?", "Confirm delete report(s)").then(() => {
            this.setState({ isLoading: true });

            this.$report.deleteSavedQuery(ids).then(() => {
                return this.refreshData();
            });
        });
    }

    selectAll = () => {
        let { reportsList, selAllChk } = this.state;
        selAllChk = !selAllChk;
        reportsList.forEach(wl => wl.selected = selAllChk);
        reportsList = [...reportsList];
        this.setState({ reportsList, selAllChk });
    }

    downloadReports = () => {
        const items = this.state.reportsList.filter((w) => w.selected);
        const ids = items.map((w) => w.id);

        if (ids.length === 0) {
            this.$message.info("Select the reports to be exported!");
            return;
        }

        this.$report.exportQueries(ids);
    }

    fileSelected = () => {
        const selector = this.fileSelector;
        const file = selector.files[0];

        if (file) {
            if (!file.name.endsWith('.jrd')) {
                this.$message.warning("Unknown file selected to import. Select a valid Jira Assist Report definition (*.jrd) file");
                selector.value = '';
                return;
            }

            const reader = new FileReader();
            reader.readAsText(file, "UTF-8");
            reader.onload = (evt) => {
                const json = evt.target.result;
                try {
                    const rpt = JSON.parse(json);
                    const reports = rpt.reports;
                    if (!reports || !Array.isArray(reports)) {
                        this.$message.error("Selected file is invalid or is corrupted");
                        return;
                    }
                    reports.forEach(r => {
                        r.oldName = r.queryName;
                        r.selected = true;
                        r.status = "Will import";
                    });
                    this.setState({ reportsToImport: reports });
                }
                catch (err) {
                    this.$message.error("Selected file is invalid or is corrupted");
                }
            };
            reader.onerror = (evt) => {
                this.$message.error("Selected file is invalid or is corrupted. Unable to load the file!");
            };
        }
        selector.value = '';
    }

    editReport = (rpt) => {
        this.router.navigateByUrl(`/reports/${rpt.advanced ? "advanced" : "customgrouped"}/${rpt.id}`);
    }

    selectRowItem(item) {
        item.selected = !item.selected;
        let { reportsList } = this.state;
        reportsList = [...reportsList];
        this.setState({ reportsList });
    }

    hideImportPopup = (refresh) => {
        if (refresh) { this.refreshData(); }
        this.setState({ reportsToImport: null });
    }

    setFileSelector = (f) => this.fileSelector = f
    chooseFileForImport = () => this.fileSelector.click()

    renderCustomActions() {
        return <>
            <input ref={this.setFileSelector} type="file" className="hide" accept=".jrd" onChange={this.fileSelected} />
            <Button icon="fa fa-upload" onClick={this.chooseFileForImport} />
            <Button icon="fa fa-download" onClick={this.downloadReports} />
            <Button type="danger" icon="fa fa-trash-o" onClick={this.deleteSelectedReports} title="Delete selected report(s)" />
        </>;
    }

    render() {
        const { reportsList, selAllChk, reportsToImport } = this.state;

        return super.renderBase(<>
            <ScrollableTable dataset={reportsList}>
                <THead>
                    <tr>
                        <Column className="w40"><Checkbox checked={selAllChk} onChange={this.selectAll} /></Column>
                        <Column sortBy="queryName">Report name</Column>
                        <Column sortBy="sortDate">Created On</Column>
                        <Column sortBy="advanced">Report type</Column>
                        <Column sortBy="filtersCount">Filter Fields</Column>
                        <Column sortBy="outputCount">Output fields</Column>
                        <Column>Options</Column>
                    </tr>
                </THead>
                <TBody>
                    {(b) => {
                        return <tr key={b.id}>
                            <td className="text-center">
                                <Checkbox checked={b.selected} onChange={() => this.selectRowItem(b)} />
                            </td>
                            <td>{b.queryName}</td>
                            <td>{b.displayDate}</td>
                            <td>{b.advanced ? 'Advanced report' : 'Custom Report'}</td>
                            <td>{b.filtersCount}</td>
                            <td>{b.outputCount}</td>
                            <td className="text-center"><Button icon="fa fa-edit" onClick={() => this.editReport(b)} title="Click to edit this report" /></td>
                        </tr>;
                    }}
                </TBody>
                <NoDataRow span={7}>You have not yet created or imported any reports.</NoDataRow>
            </ScrollableTable>
            {reportsToImport && <ImportReports reportsToImport={reportsToImport} onHide={this.hideImportPopup} />}
        </>);
    }
}

export default MyReports;

class ImportReports extends BaseDialog {
    constructor(props) {
        super(props, "Select reports to import");
        inject(this, "UserUtilsService", "MessageService", "ReportService");

        this.style = { width: "850px" };
        this.state.selectAll = true;
        this.state.reportsToImport = this.props.reportsToImport;
        this.state.selReportsCount = this.getReportsCount();
    }

    selectAllReports = () => {
        let { selectAll, reportsToImport } = this.state;
        selectAll = !selectAll;
        reportsToImport = [...reportsToImport];

        reportsToImport.forEach((r) => {
            r.selected = !r.disabled && selectAll;
            this.updateReportStatus(r);
        });

        this.setState({
            selectAll, reportsToImport,
            selReportsCount: this.getReportsCount(reportsToImport)
        });
    }

    reportSelected(report) {
        report.selected = !report.selected;

        this.updateReportStatus(report);

        this.setState({ selReportsCount: this.getReportsCount() });
    }

    updateReportStatus(report) {
        if (report.selected) {
            if (!report.queryName) {
                report.queryName = report.oldName;
            }

            report.status = "Will import";
        }
        else {
            report.status = "Excluded";
        }
    }

    getReportsCount = (reportsToImport) => (reportsToImport || this.state.reportsToImport).filter((r) => r.selected).length

    reportNameChanged(rpt, newName) {
        rpt.queryName = newName;

        if (rpt.queryName) {
            rpt.status = "Will import";
        }
        else {
            rpt.status = "Name required";
        }

        this.forceUpdate();
    }

    importReports = () => {
        const selectedReports = this.state.reportsToImport.filter((r) => r.selected);

        const saveAction = selectedReports.map((r) => {
            const newObj = { ...r };

            delete newObj.selected;
            delete newObj.id;
            delete newObj.oldName;
            delete newObj.status;

            return this.$report.saveQuery(newObj).then(s => {
                r.selected = false;
                r.disabled = true;
                r.status = "Imported";
                return true;
            }, () => {
                r.status = "Duplicate name";
                return false;
            });
        });

        Promise.all(saveAction).then((result) => {
            if (result.all(r => r)) {
                this.$message.success(`${selectedReports.length} selected reports were imported`, "Reports imported");
                this.onHide(true);
            }
            else {
                this.$message.error("Some of the reports were not import!", "Import failed");
                let { reportsToImport } = this.state;
                reportsToImport = [...reportsToImport];
                this.setState({ selReportsCount: this.getReportsCount(reportsToImport), reportsToImport });
            }
        });
    }

    getFooter() {
        const { selReportsCount } = this.state;

        return <>
            <Button icon="fa fa-times" onClick={this.onHide} label="Cancel" type="default" />
            <Button icon="fa fa-check" disabled={!selReportsCount} onClick={this.importReports} label="Import" type="primary" />
        </>;
    }

    render() {
        const { reportsToImport, selectAll } = this.state;

        return super.renderBase(<div>
            <ScrollableTable dataset={reportsToImport}>
                <caption>Select all the reports which you would like to import and provide a name for the report to import.</caption>
                <THead>
                    <tr>
                        <th className="no-min-width no-pad"><Checkbox checked={selectAll} onChange={this.selectAllReports} /></th>
                        <th>Report name</th>
                        <th>Report name (new)</th>
                        <th>Created date</th>
                        <th>Last modified date</th>
                        <th>Status</th>
                    </tr>
                </THead>
                <TBody>
                    {(rpt, i) => (<tr key={`${i}_${rpt.status}`}>
                        <td className="data-center"><Checkbox checked={rpt.selected} disabled={rpt.disabled} onChange={(val) => this.reportSelected(rpt, val)} /></td>
                        <td>{rpt.oldName}</td>
                        <td><TextBox value={rpt.queryName} disabled={rpt.disabled || !rpt.selected} onChange={(val) => this.reportNameChanged(rpt, val)} /></td>
                        <td>{this.$userutils.formatDateTime(rpt.dateCreated)}</td>
                        <td>{this.$userutils.formatDateTime(rpt.dateUpdated)}</td>
                        <td>{rpt.status}</td>
                    </tr>)}
                </TBody>
            </ScrollableTable>
        </div >);
    }
}