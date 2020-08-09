import React from 'react';
import { inject } from '../services/injector-service';
import BaseControl from './BaseControl';
import { showContextMenu } from 'jsd-report';

class TicketDisplay extends BaseControl {
    constructor(props) {
        super(props);
        inject(this, "UserUtilsService", "BookmarkService");

        this.contextMenu = [
            !props.hideWorklog && { label: "Add worklog", icon: "fa fa-clock-o", command: () => props.onAddWorklog(props.value) },
            { label: "Bookmark", icon: "fa fa-bookmark", command: () => this.addBookmark() }
            //{ label: "Start progress", icon: "fa fa-play", command: () => this.startProgress() } //ToDo: Add option for move to progress, show in tree view
        ].filter(Boolean);
    }

    renderControl() {
        const { value, url = this.$userutils.getTicketUrl(value) } = this.props;

        if (!value) { return null; }

        return (<>
            <i className="fa fa-ellipsis-v margin-r-8" onClick={this.showContext}></i>
            <a href={url} className="link strike" target="_blank" rel="noopener noreferrer">{value}</a>
        </>);
    }

    showContext = ($event) => {
        showContextMenu($event, this.contextMenu);
    }

    //startProgress() { Dialog.alert("This functionality is not yet implemented!", "Unimplemented functionality!"); }

    addBookmark() {
        const { value, onBookmark } = this.props;

        this.$bookmark.addBookmark([value], !onBookmark).then(onBookmark);
    }
}

export default TicketDisplay;