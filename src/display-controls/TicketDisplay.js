import React from 'react';
import { inject } from '../services/injector-service';
import BaseControl from './BaseControl';
import { showContextMenu } from '../externals/jsd-report';
import { WorklogContext } from '../common/context';

class TicketDisplay extends BaseControl {
    static contextType = WorklogContext;
    constructor(props) {
        super(props);
        inject(this, "UserUtilsService", "BookmarkService");

        this.contextMenu = [
            !props.hideWorklog && { label: "Add worklog", icon: "fa fa-clock-o", command: this.addWorklog.bind(this) },
            { label: "Bookmark", icon: "fa fa-bookmark", command: () => this.addBookmark() }
            //{ label: "Start progress", icon: "fa fa-play", command: () => this.startProgress() } //ToDo: Add option for move to progress, show in tree view
        ].filter(Boolean);
    }

    renderControl(badge) {
        const { value, url = this.$userutils.getTicketUrl(value), hideContext } = this.props;

        if (!value) { return badge; }

        return (<>
            {!hideContext && <i className="fa fa-ellipsis-v margin-r-8" onClick={this.showContext}></i>}
            <a href={url} className="link strike" target="_blank" rel="noopener noreferrer">{value}</a>
            {badge}
        </>);
    }

    startTimer = () => this.context.startTimer(this.props.value);

    showContext = ($event) => {
        const menus = [...this.contextMenu];
        try {
            const result = this.context.getElapsedTimeInSecs();

            const isCurTicket = result?.key === this.props.value;
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
    };

    //startProgress() { Dialog.alert("This functionality is not yet implemented!", "Unimplemented functionality!"); }

    addWorklog() {
        const { onAddWorklog, value } = this.props;
        if (onAddWorklog) {
            onAddWorklog(value);
        } else {
            console.error('Add worklog function is not yet implemented');
        }
    }

    addBookmark() {
        const { value, onBookmark } = this.props;

        this.$bookmark.addBookmark([value], !onBookmark).then(onBookmark);
    }
}

export default TicketDisplay;