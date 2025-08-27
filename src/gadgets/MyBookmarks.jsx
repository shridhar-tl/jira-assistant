import React from 'react';
import BaseGadget from './BaseGadget';
import { GadgetActionType } from '.';
import { ScrollableTable, THead, TBody, Column, NoDataRow } from '../components/ScrollableTable';
import { showContextMenu } from '../components/ContextMenu';
import { inject } from '../services/injector-service';
import { Button, Checkbox, Image } from '../controls';
import AddBookmark from '../dialogs/AddBookmark';
import Dialog from '../dialogs';
import { WorklogContext } from '../common/context';
import Link from '../controls/Link';

class MyBookmarks extends BaseGadget {
    static contextType = WorklogContext;
    constructor(props) {
        super(props, 'My Bookmarks', 'fa-bookmark');
        inject(this, "JiraService", "BookmarkService", "UtilsService", "UserUtilsService", "MessageService");

        this.contextMenu = [
            { label: "Select Bookmark", icon: "fa fa-check-square", command: () => this.selectTicket(this.selectedTicket) },
            { label: "Add worklog", icon: "fa fa-clock", command: () => this.addWorklogOn(this.selectedTicket.ticketNo) },
            { label: "Delete Bookmark", icon: "fa fa-trash", command: () => this.deleteBookmark(this.selectedTicket.ticketNo) } //ToDo: Add option for move to progress, show in tree view
        ];

        this.state.selAllBks = false;
        this.state.bookmarksList = [];
    }

    selectTicket(ticket) {
        ticket.selected = !ticket.selected;
        let { bookmarksList } = this.state;
        bookmarksList = [...bookmarksList];
        this.setState({ bookmarksList });
    }

    componentDidMount() {
        super.componentDidMount();
        this.refreshData();
    }

    refreshData = () => {
        this.setState({ isLoading: true, showAddPopup: false });

        this.$bookmark.getBookmarks()
            .then((result) => {
                const { selAllChk } = this.state;

                result.forEach(b => {
                    b.ticketUrl = this.$userutils.getTicketUrl(b.ticketNo);
                    b.selected = selAllChk;
                    b.rowClass = this.$utils.getRowStatus(b);
                });

                this.setState({ isLoading: false, bookmarksList: result });
            });
    };

    startTimer = () => this.context.startTimer(this.selectedTicket.ticketNo);

    showContext($event, b) {
        this.selectedTicket = b;

        const menus = [...this.contextMenu];

        try {
            const result = this.context.getElapsedTimeInSecs();

            const isCurTicket = result?.key === b.ticketNo;
            const isRunning = result?.isRunning;
            if (!isCurTicket) {
                menus.push({ label: "Start timer", icon: "fa fa-play", command: this.startTimer });
            } else {
                if (isRunning) {
                    menus.push({ label: "Pause timer", icon: "fa fa-pause", command: this.context.pauseTimer });
                } else {
                    menus.push({ label: "Resume timer", icon: "fa fa-play", command: this.context.resumeTimer });
                }
                menus.push({ label: "Stop timer", icon: "fa fa-stop", command: this.context.stopTimer });
            }
        } catch { /* Nothing to do as of now */ }

        showContextMenu($event, menus);
    }

    selectAll = (selAllChk) => {
        let { bookmarksList } = this.state;
        bookmarksList = [...bookmarksList];
        bookmarksList.forEach(wl => wl.selected = selAllChk);
        this.setState({ selAllChk, bookmarksList });
    };

    deleteSelection = () => this.deleteBookmark();
    deleteBookmark(ticketNo) {
        let ids;
        if (ticketNo) {
            ids = [ticketNo];
        }
        else {
            ids = this.state.bookmarksList.filter((b) => b.selected).map((b) => b.ticketNo);
        }
        if (ids.length === 0) {
            this.$message.info("Select the bookmarks to be deleted!");
            return;
        }

        Dialog.confirmDelete("Are you sure to delete the selected bookmark(s)?", "Confirm delete bookmark(s)").then(() => {
            this.setState({ isLoading: true });

            this.$bookmark.removeBookmark(ids).then((result) => {
                this.setState({ bookmarksList: result, isLoading: false });
            });
        });
    }

    executeEvent(action) {
        if (action.type === GadgetActionType.TicketBookmarked) {
            this.refreshData();
        }
    }

    showAddPopup = () => this.setState({ showAddPopup: true });
    hideAddPopup = (added) => {
        if (added) {
            this.refreshData();
        } else {
            this.setState({ showAddPopup: false });
        }
    };

    renderCustomActions() {
        return <>
            <Button text icon="fa fa-plus" onClick={this.showAddPopup} title="Add ticket to bookmarks" />
            <Button text type="danger" icon="fa fa-trash" onClick={this.deleteSelection} title="Remove selected ticket(s) from bookmarks" />
        </>;
    }

    render() {
        const { bookmarksList, selAllChk, showAddPopup } = this.state;

        return super.renderBase(<>
            <ScrollableTable dataset={bookmarksList} exportSheetName="My bookmarks">
                <THead>
                    <tr>
                        <Column className="w40" noExport={true}><Checkbox checked={selAllChk} onChange={this.selectAll} /></Column>
                        <Column sortBy="ticketNo">Ticket No</Column>
                        <Column sortBy="issuetype">Type</Column>
                        <Column sortBy="summary">Summary</Column>
                        <Column sortBy="assigneeName">Assignee</Column>
                        <Column sortBy="reporter">Reporter</Column>
                        <Column sortBy="priority">Priority</Column>
                        <Column sortBy="status">Status</Column>
                        <Column sortBy="resolution">Resolution</Column>
                        <Column sortBy="createdSortable">Created</Column>
                        <Column sortBy="updatedSortable">Updated</Column>
                    </tr>
                </THead>
                <TBody>
                    {(b, i) => <tr key={b.ticketNo} data-test-id={b.ticketNo} onContextMenu={(e) => this.showContext(e, b)} className={b.rowClass}>
                        <td className="text-center">
                            {b.selected && <Checkbox checked={true} onChange={() => this.selectTicket(b)} />}
                            {!b.selected && <i className="fa fa-ellipsis-v" onClick={(e) => this.showContext(e, b)}></i>}
                        </td>
                        <td>
                            <Link href={b.ticketUrl} className="link strike">{b.ticketNo}</Link>
                        </td>
                        <td>{b.issuetypeIcon && <Image src={b.issuetypeIcon} />}{b.issuetype}</td>
                        <td>{b.summary}</td>
                        <td>{b.assigneeName}</td>
                        <td>{b.reporterName}</td>
                        <td>{b.priorityIcon && <Image src={b.priorityIcon} />}{b.priority}</td>
                        <td>{b.statusIcon && <Image src={b.statusIcon} />}{b.status}</td>
                        <td>{b.resolutionIcon && <Image src={b.resolutionIcon} />}{b.resolution}</td>
                        <td>{b.created}</td>
                        <td>{b.updated}</td>
                    </tr>}
                </TBody>
                <NoDataRow span={11}>You have not yet bookmarked any tickets. Bookmark your frequently used tickets</NoDataRow>
            </ScrollableTable>
            {showAddPopup && <AddBookmark onHide={this.hideAddPopup} />}
        </>
        );
    }
}

export default MyBookmarks;