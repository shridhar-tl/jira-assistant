import React from 'react';
import { inject } from '../services/injector-service';
import { ScrollableTable, THead, TBody, Column, NoDataRow } from '../components/ScrollableTable';
import BaseGadget from './BaseGadget';
import { Button } from 'primereact/button';

class MyReports extends BaseGadget {
    constructor(props) {
        super(props, 'My Reports', 'fa-filter');
        inject(this, "ReportService", "MessageService", "UserUtils");
        this.state.isLoading = true;
    }

    UNSAFE_componentWillMount() {
        this.refreshData();
    }

    refreshData() {
        this.setState({ isLoading: true });
        this.$report.getReportsList()
            .then((result) => {
                result.forEach(r => {
                    r.displayDate = this.$userutils.formatDateTime(r.dateCreated);
                    r.sortDate = r.dateCreated.getTime();
                });
                this.setState({ savedQueries: result, isLoading: false });
            });
    }

    deleteQuery(items) {
        if (!items) {
            items = this.savedQueries.filter((w) => w.selected);
        }
        const ids = items.map((w) => w.id);
        if (ids.length === 0) {
            this.$message.info("Select the reports to be deleted!");
            return;
        }
        this.isLoading = true;
        this.$report.deleteSavedQuery(ids).then(() => {
            return this.fillSavedQuery();
        });
    }

    selectAll = () => {
        let { savedQueries, selAllChk } = this.state;
        selAllChk = !selAllChk;
        savedQueries.forEach(wl => wl.selected = selAllChk);
        savedQueries = [...savedQueries];
        this.setState({ savedQueries, selAllChk });
    }

    downloadReports() {
        const items = this.savedQueries.filter((w) => w.selected);
        const ids = items.map((w) => w.id);
        if (ids.length === 0) {
            this.$message.info("Select the reports to be exported!");
            return;
        }
        this.$report.exportQueries(ids);
    }

    importReports(save) {
        if (!save) {
            const selector = this.fileSelector.nativeElement;
            selector.click();
        }
        else {
            const selectedReports = this.reportsToImport.filter((r) => r.selected);
            const saveAction = selectedReports.map((r) => {
                const newObj = Object.assign({}, r);
                delete newObj.selected;
                delete newObj.id;
                delete newObj.oldName;
                delete newObj.status;
                return this.$report.saveQuery(newObj).then(s => {
                    r.selected = false;
                    r.disabled = true;
                    r.status = "Imported";
                }, err => { r.status = "Duplicate name"; return Promise.reject(err); });
            });
            Promise.all(saveAction).then(() => {
                this.$message.success(`${selectedReports.length} selected reports were imported`, "Reports imported");
                this.refreshData();
                this.reportsToImport = null;
            }, () => { this.$message.error("Some of the reports were not import!", "Import failed"); this.updateSelReportCount(); });
        }
    }

    fileSelected($event) {
        const selector = this.fileSelector.nativeElement;
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
                    this.reportsToImport = reports;
                    this.updateSelReportCount();
                    this.selAllRpts = true;
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

    reportSelected(report) {
        if (!report.selected) {
            if (!report.queryName) {
                report.queryName = report.oldName;
            }
            report.status = "Will import";
        }
        else {
            report.status = "Excluded";
        }
        this.updateSelReportCount();
    }

    updateSelReportCount() {
        this.selReportsCount = this.reportsToImport.filter((r) => r.selected).length;
    }

    selAllReports() {
        this.selAllRpts = !this.selAllRpts;
        this.reportsToImport.forEach((r) => r.selected = !r.disabled && this.selAllRpts);
        this.updateSelReportCount();
    }

    reportNameChanged(rpt) {
        if (rpt.queryName) {
            rpt.status = "Will import";
        }
        else {
            rpt.status = "Name required";
        }
    }

    editReport(rpt) {
        this.router.navigateByUrl(`/reports/${rpt.advanced ? "advanced" : "customgrouped"}/${rpt.id}`);
    }

    selectRowItem(item) {
        item.selected = !item.selected;
        let { savedQueries } = this.state;
        savedQueries = [...savedQueries];
        this.setState({ savedQueries });
    }

    render() {
        const { savedQueries, selAllChk } = this.state;

        return super.renderBase(
            <ScrollableTable dataset={savedQueries}>
                <THead>
                    <tr>
                        <Column className="w40"><input type="checkbox" checked={selAllChk} onChange={this.selectAll} /></Column>
                        <Column sortBy="queryName">Report name</Column>
                        <Column sortBy="sortDate">Created On</Column>
                        <Column sortBy="advanced">Report type</Column>
                        <Column sortBy="filtersCount">Filter Fields</Column>
                        <Column sortBy="outputCount">Output fields</Column>
                        <Column>Options</Column>
                    </tr>
                </THead>
                <TBody>
                    {(b, i) => {
                        return <tr key={b.id}>
                            <td className="text-center">
                                <input type="checkbox" checked={b.selected} onChange={() => this.selectRowItem(b)} />
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
        );
    }
}

export default MyReports;