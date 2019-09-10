import React from 'react';
import BaseDialog from './BaseDialog';
import { Button, MultiValueText } from '../controls';
import { inject } from '../services';

class AddBookmark extends BaseDialog {
    constructor(props) {
        super(props, "Add Bookmark");
        inject(this, "BookmarkService", "MessageService");
        this.style.width = "380px";
        this.state.ticketsList = [];
    }

    addBookmark = () => {
        const { ticketsList } = this.state;

        if (ticketsList.length > 0) {

            this.setState({ isLoading: true });

            this.$bookmark.addBookmark(ticketsList)
                .then((result) => {
                    if (result.length === 0) {
                        this.onHide(true);
                    }
                    else {
                        this.setState({ isLoading: false, ticketsList: result });

                        if (ticketsList.length === result.length) {
                            this.$message.warning("None of the ticket numbers provided are valid.");
                        }
                        else if (ticketsList.length > result.length) {
                            this.$message.warning("Some of the ticket numbers provided are not valid.");
                        }
                    }
                });
        }
        else {
            this.onHide();
        }
    }

    listChanged = (ticketsList) => this.setState({ ticketsList })

    getFooter() {
        return <>
            <Button type="primary" onClick={this.addBookmark} label="Save" />
            <Button type="default" onClick={this.onHide} label="Cancel" />
        </>;
    }

    render() {
        const { state: { ticketsList } } = this;

        return super.renderBase(<div className="pad-22">
            <MultiValueText value={ticketsList} onChange={this.listChanged} placeholder="Enter one or more ticket numbers" />
            <strong>Note:</strong> Press enter key to add multiple items
        </div>);
    }
}

export default AddBookmark;