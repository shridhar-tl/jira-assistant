import React from 'react';
import BaseGadget from '../../gadgets/BaseGadget';
import Papa from "papaparse";
import { Button } from '../../controls';
import { inject } from '../../services/injector-service';
import Link from '../../controls/Link';

class BaseImport extends BaseGadget {
    constructor(props, importType, icon) {
        super(props, `Bulk import - [${importType}]`, icon);
        inject(this, "UserUtilsService");
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
    };

    formatDate(value) {
        if (value instanceof Date) {
            return this.$userutils.formatDateTime(value);
        }
        else {
            return value;
        }
    }

    getTicketLink = (ticketNo) => <Link className="link" href={this.$userutils.getTicketUrl(ticketNo)}>{ticketNo}</Link>;

    setFileSelector = (f) => this.fileSelector = f;
    chooseFileForImport = () => this.fileSelector.click();

    renderCustomActions() {
        return <>
            <input ref={this.setFileSelector} type="file" className="hide" accept=".csv,.json, .xlsx" onChange={this.fileSelected} />
            <Button icon="fa fa-upload" onClick={this.chooseFileForImport} title="Choose file to import" />
        </>;
    }
}

export default BaseImport;