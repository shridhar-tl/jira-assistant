import React from 'react';
import BaseGadget from '../../gadgets/BaseGadget';
import Papa from "papaparse";
import { Button } from '../../controls';

class BaseImport extends BaseGadget {
    constructor(props, importType, icon) {
        super(props, `Bulk import - [${importType}]`, icon);
        this.isGadget = false;
        this.hideRefresh = true;
    }

    fileSelected = () => {
        const selector = this.fileSelector;
        const file = selector.files[0];

        if (file) {
            if (!file.name.endsWith('.csv')) {
                this.$message.warning("Unknown file selected to import. Select a valid file to import");
                selector.value = '';
                return;
            }

            Papa.parse(file, {
                header: true,
                transformHeader: this.transformHeader,
                skipEmptyLines: 'greedy',
                complete: (result) => {
                    const { data } = result;

                    if (!data || !data.length) {
                        this.$message.warning("No rows found to import", "No records exists");
                    }

                    this.processData(data);
                }
            });
        }
        selector.value = '';
    }

    formatDate(value) {
        if (value instanceof Date) {
            return this.$userutils.formatDateTime(value);
        }
        else {
            return value;
        }
    }

    getTicketLink(ticketNo) {
        return <a className="link" href={this.$userutils.getTicketUrl(ticketNo)} target="_blank" rel="noopener noreferrer">{ticketNo}</a>;
    }

    setFileSelector = (f) => this.fileSelector = f
    chooseFileForImport = () => this.fileSelector.click()

    renderCustomActions() {
        return <>
            <input ref={this.setFileSelector} type="file" className="hide" accept=".csv,.json, .xlsx" onChange={this.fileSelected} />
            <Button icon="fa fa-upload" onClick={this.chooseFileForImport} title="Choose file to import" />
        </>;
    }
}

export default BaseImport;