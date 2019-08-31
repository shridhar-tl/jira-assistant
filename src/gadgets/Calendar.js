import React from 'react';
import $ from 'jquery';
import BaseGadget from './BaseGadget';
import { inject } from '../services/injector-service';
import { GadgetActionType } from '.';
import { FullCalendar } from 'primereact/fullcalendar';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import * as moment from 'moment';
//import { toMoment, toDuration } from '@fullcalendar/moment';
import Button from '../controls/Button';
import SelectBox from '../controls/SelectBox';
import { hideContextMenu, showContextMenu } from '../controls/ContextMenu';
import AddWorklog from '../dialogs/AddWorklog';
import './Calendar.scss';

//var moment;
const viewModes = [{ value: 'dayGridMonth', label: 'Month' }, { value: 'timeGridWeek', label: 'Week' }, { value: 'timeGridDay', label: 'Day' }];

class Calendar extends BaseGadget {
    constructor(props) {
        super(props, "Calendar", "fa-calendar");
        inject(this, "SessionService", "WorklogService", "MessageService", "AnalyticsService", "CalendarService", "UtilsService", "ConfigService");

        if (this.$session.pageSettings.calendar) {
            this.settings = Object.assign({}, this.$session.pageSettings.calendar);
        }
        else {
            this.settings = { viewMode: 'timeGridWeek', showMeetings: true, showWorklogs: true, showInfo: true };
        }

        this.setMenuItems();

        this.CurrentUser = this.$session.CurrentUser;
        //this.defaultView = this.settings.viewMode || "month";
        this.maxTime = this.CurrentUser.maxHours;
        if (this.maxTime) {
            this.maxTime = this.maxTime * 60 * 60;
        }

        this.fullCalendarOpts = this.getCalendarOptions();

        //moment = (date) => toMoment(date, this.fc.calendar)
    }

    UNSAFE_componentWillMount() {
        this.refreshData();
    }

    setMenuItems() {
        this.mnuWL_Upload = { label: "Upload worklog", icon: "fa fa-upload", command: () => this.uploadWorklog() };

        this.contextMenuItems = [
            { label: "Edit worklog", icon: "fa fa-edit", command: () => this.showWorklogPopup(this.currentWLItem) },
            { label: "Copy worklog", icon: "fa fa-copy", command: () => this.copyWorklog() },
            this.mnuWL_Upload,
            { label: "Delete worklog", icon: "fa fa-times", command: () => this.deleteWorklog() }
        ];

        const meetingTicket = (this.$session.CurrentUser.meetingTicket || "").trim().split(',').select(t => t || null);
        const wlTickets = [];
        if (meetingTicket.length > 0) {
            meetingTicket.forEach(t => wlTickets.push({
                label: t, icon: "fa fa-ticket",
                command: (e) => this.createWorklog(e.originalEvent, this.currentMeetingItem, t)
            }));
            if (meetingTicket.length === 1) {
                this.defaultMeetingTicket = meetingTicket[0];
            }
        }
        if (wlTickets.length > 0) {
            wlTickets.push({ separator: true });
        }
        wlTickets.push({
            label: 'Choose ticket', icon: "fa fa-pencil-square-o",
            command: (e) => this.createWorklog(e.originalEvent, this.currentMeetingItem, "")
        });
        this.mnuCal_AddWL = { label: "Add worklog to", icon: "fa fa-clock-o", items: wlTickets, command: (e) => this.createWorklog(e.originalEvent, this.currentMeetingItem, "") };
        this.mnuCal_OpenUrl = { label: "Open video call", icon: "fa fa-video-camera", command: () => this.openVideoCall(this.currentMeetingItem) };
        this.calMenuItems = [
            this.mnuCal_AddWL,
            { label: "Show details", icon: "fa fa-info-circle", command: (e) => this.showCalendarDetails({ sourceObject: this.currentMeetingItem }, e.originalEvent, null) },
            this.mnuCal_OpenUrl
        ];
    }

    getCalendarOptions() {
        const { startOfWeek, startOfDay, endOfDay, workingDays } = this.CurrentUser;
        let { viewMode } = this.props;

        if (!this.isGadget) {
            viewMode = this.settings.viewMode;

            if (viewMode === "agendaWeek") {
                viewMode = "timeGridWeek";
                //ToDo: this.settings.viewMode = viewMode;
            }

            if (viewMode === "agendaDay") {
                viewMode = "timeGridDay";
                //ToDo: this.settings.viewMode = viewMode;
            }
        }

        let firstDay = startOfWeek;
        if (firstDay && firstDay > 0) {
            firstDay = firstDay - 1;
        }
        else {
            firstDay = null;
        }

        return {
            plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
            timezone: 'local',
            selectHelper: true, //ToDo: need to check what is this

            // Event Display
            displayEventTime: true,

            // Date Clicking & Selecting
            selectable: true,

            // International
            firstDay,

            // Sizing
            height: "parent",

            // Month view
            fixedWeekCount: false,

            // Event Popover
            eventLimit: true,

            // Event Dragging & Resizing
            editable: true,
            droppable: true,

            // Time-Axis Settings
            slotDuration: "00:15:00",
            minTime: startOfDay || "10:00", //"08:00:00",
            maxTime: endOfDay || "19:00", //"22:00:00",

            // TimeGrid View
            allDayText: "total",

            // Toolbar
            header: false,

            // Now Indicator
            nowIndicator: true,

            // Date Nav Links
            navLinks: true,

            // View API
            defaultView: viewMode,

            // Business Hours
            businessHours: {
                // days of week. an array of zero-based day of week integers (0=Sunday)
                dow: workingDays || [1, 2, 3, 4, 5],
                start: startOfDay || "10:00",
                end: endOfDay || "19:00",
            },

            // Functions
            select: this.select.bind(this),
            eventRender: this.eventRender.bind(this),
            //viewSkeletonRender: this.viewRender.bind(this),
            datesRender: this.viewRender.bind(this),
            eventDrop: this.eventDrop.bind(this),
            eventResize: this.eventResize.bind(this),
            eventClick: this.eventClick.bind(this),
        };
    }

    UNSAFE_componentWillReceiveProps(newProps) {
        if (newProps.viewMode && newProps.viewMode.currentValue) {
            this.settings.viewMode = this.viewMode;
            //this.viewModeChanged();
        }
        super.UNSAFE_componentWillReceiveProps(newProps);
    }

    refreshData = () => {
        this.fillEvents(this.startDate, this.endDate);
    }

    viewModeChanged = (viewMode) => {
        this.settings.viewMode = viewMode;
        this.setState({ viewMode });
        this.fc.calendar.changeView(viewMode);
        this.saveSettings();
    }

    createWorklog($event, m, mTicket) {
        this.calMenu.hide();
        if (!m.start.dateTime) {
            return;
        }
        $event.stopPropagation();
        $event.preventDefault();
        this.calMenu.hide();
        const diff = moment.duration(moment(m.end.dateTime).diff(m.start.dateTime));
        const obj = {
            dateStarted: m.start.dateTime,
            timeSpent: `${diff.hours().pad(2)}:${diff.minutes().pad(2)}`,
            description: m.summary,
            parentId: m.id
        };
        if (mTicket) {
            obj.ticketNo = mTicket;
            this.$worklog.saveWorklog(obj).then((entry) => {
                this.addEvent({ added: entry });
                $($event.currentTarget).remove();
            });
            this.$analytics.trackEvent("Quick add WL");
        }
        else {
            this.showWorklogPopup(obj);
        }
        return false;
    }

    fillEvents(start, end) {
        start = moment(start).startOf('day');
        end = moment(end).endOf('day');
        const filter = (data) => {
            const types = [];
            const ps = this.settings;
            if (ps.showMeetings) { types.push(2); }
            if (ps.showWorklogs) { types.push(1); }
            if (ps.showInfo) { types.push(3); }
            switch (types.length) {
                case 0:
                    data = [];
                    break;
                case 3: break;
                default:
                    data = data.filter((e) => { return types.indexOf(e.entryType) > -1; });
                    break;
            }
            this.setColors(data);
            this.setEventsData(data);
        };

        const req = [this.$worklog.getWorklogsEntry(start, end)];
        if (this.CurrentUser.gIntegration && this.CurrentUser.hasGoogleCreds && this.settings.showMeetings) {
            req.push(this.$calendar.getEvents(start, end).then((data) => { return data; }, (err) => {
                let msg = "Unable to fetch meetings!";
                if (err.error && err.error.message) {
                    msg += `<br /><br />Reason:- ${err.error.message}`;
                }
                this.$message.warning(msg);
                return [];
            }));
            this.hasCalendarData = true;
        }
        else {
            this.hasCalendarData = false;
        }
        this.setState({ isLoading: true, uploading: false });
        Promise.all(req).then((arr) => {
            this.setState({ isLoading: false });
            const data = arr[0];
            const allDayEvents = data.filter((d) => { return d.entryType === 1; })
                .groupBy((key) => { return moment(key.start).format("YYYY-MM-DD"); })
                .map((d) => this.getAllDayObj(d));
            this.latestData = data;
            filter(data.addRange(allDayEvents).addRange(arr[1]));
        }, (err) => { this.setState({ isLoading: false }); return Promise.reject(err); });
    }

    setLoggedTime(arr, obj) {
        const time = this.getTimeSpent(arr);
        obj.logged = time;
        let title = `Logged: ${this.$utils.formatSecs(time)}`;
        obj.diff = time - this.maxTime;
        if (this.maxTime && obj.diff) {
            title += ` (${obj.diff > 0 ? "+" : "-"}${this.$utils.formatSecs(Math.abs(obj.diff))})`;
        }
        this.setInfoColor(obj, this.settings);
        obj.title = title;
        return obj;
    }

    setInfoColor(obj, ps) {
        if (this.maxTime && obj.diff) {
            obj.color = obj.diff > 0 ? ps.infoColor_high : ps.infoColor_less;
        }
        else {
            obj.color = ps.infoColor_valid;
        }
        //obj.textColor = "";
    }

    getTimeSpent(arr) {
        return arr.sum((v) => {
            const s = moment(v.start);
            const e = moment(v.end);
            const diff = moment.duration(e.diff(s));
            return diff.asSeconds();
        });
    }

    updateAllDayEvent(result) {
        const key = moment(result.start).format("YYYY-MM-DD");
        const { events } = this;
        events.removeAll((e) => e.id === key && e.entryType === 3);
        const logs = events.filter((a) => { return a.entryType === 1 && moment(a.start).format("YYYY-MM-DD") === key; });
        if (logs && logs.length > 0) {
            const allDayEvent = this.getAllDayObj({ key: key, values: logs });
            if (allDayEvent.logged) {
                events.push(allDayEvent);
                //this.calendar.renderEvent(allDayEvent);
                this.setLoggedTime(logs, allDayEvent);
                //this.calendar.updateEvent(allDayEvent)
            }
        }
        this.setEventsData(events);
        this.performAction(GadgetActionType.WorklogModified);
    }

    hideWorklogDialog = () => {
        this.setState({ showAddWorklogPopup: false });
    }

    showWorklogPopup(obj) {
        hideContextMenu();
        const newState = { showAddWorklogPopup: true };

        if (obj.copy) {
            newState.worklogItem = obj.copy;
            this.setState(newState);
            return;
        }
        let worklogObj;
        if (obj.id || obj.parentId) {
            worklogObj = obj;
        }
        else {
            const diff = moment.duration(obj.end.diff(obj.start));
            worklogObj = {
                timeSpent: `${diff.hours().pad(2)}:${diff.minutes().pad(2)}`,
                allowOverride: true
            };
            if (obj.dateStarted) {
                worklogObj.startTime = obj.dateStarted;
            }
            else {
                worklogObj.startTime = obj.isMonthMode ? moment(`${obj.start.format("YYYY-MM-DD")} ${this.CurrentUser.startOfDay}`, "YYYY-MM-DD HH:mm").toDate() : obj.start.toDate();
            }
        }
        newState.worklogItem = worklogObj;
        this.setState(newState);
    }

    addEvent = (result) => {
        if (result.type === 0) {
            return;
        } // This will be triggered when closing the popup
        let resp = false;
        const { events } = this;

        if (result.removed) {
            const removedId = result.removed + (result.deletedObj.worklogId ? `#${result.deletedObj.worklogId}` : "");
            result = events.first((e) => { return e.id === removedId && e.entryType === 1; });
            events.remove(result);
            this.latestData.remove((e) => { return e.id === result.id && e.entryType === 1; });
        }
        else if (result.added || result.edited) {
            const previousTime = result.previousTime;
            result = result.added || result.edited;
            result.color = this.settings.worklogColor; // Set color for newely added worklog
            events.removeAll((e) => e.id === result.id && e.entryType === 1);
            events.push(result);
            this.latestData.removeAll((e) => e.id === result.id && e.entryType === 1);
            this.latestData.push(result);
            resp = true;
            if (previousTime) {
                this.updateAllDayEvent({ start: previousTime });
            }
        }
        this.updateAllDayEvent(result);

        //events.removeAll((e) => e.entryType === 3);
        this.setEventsData(events);
        return resp;
    }

    setEventsData(events) {
        this.events = [...events];
        this.setState({ isLoading: false, events: [...events], pendingWorklogCount: this.getPendingWorklogs(events).length });
    }

    getAllDayObj(d) {
        return this.setLoggedTime(d.values, {
            id: d.key, entryType: 3, start: d.key,
            allDay: true, editable: false
        });
    }

    setColors(data) {
        const ps = this.settings;
        const wc = ps.worklogColor, ec = ps.eventColor;
        data.forEach((w) => {
            switch (w.entryType) {
                case 1:
                    w.color = wc;
                    break; // Set color for worklogs
                case 2:
                    w.color = ec;
                    break; // Set color for events
                case 3:
                    this.setInfoColor(w, ps);
                    break; // Set color for info
                default: break;
            }
        });
    }

    select({ start, end, allDay }) {
        const isMonthMode = this.settings.viewMode === "dayGridMonth";

        if (!isMonthMode && allDay) {// start.hasTime() ==> allDay
            return false;
        }
        this.showWorklogPopup({ isMonthMode: isMonthMode, start: moment(start), end: moment(end) });
        return false;
    }

    showCalendarDetails(event, jsEvent, view) {
        hideContextMenu();
        jsEvent.preventDefault();
        jsEvent.stopPropagation();
        const item = event.extendedProps.sourceObject;

        this.currentMeetingItem = {
            summary: item.summary,
            htmlLink: item.htmlLink,
            location: item.location,
            description: item.description,
            descrLimit: 350,
            creator: item.creator,
            organizer: item.organizer
        };
        if (item.start) {
            this.currentMeetingItem.date = this.$utils.formatDate(item.start.dateTime);
            this.currentMeetingItem.startTime = this.$utils.formatTime(item.start.dateTime);
            let remaining = moment(item.start.dateTime).diff(moment());
            if (remaining < 0) {
                if (item.end && item.end.dateTime && moment().diff(item.end.dateTime) < 0) {
                    remaining = "(now ongoing)";
                }
                else {
                    remaining = "";
                }
            }
            else {
                remaining = `(in ${this.$utils.formatTs(remaining)})`;
            }
            this.currentMeetingItem.remaining = remaining;
        }
        if (item.end && item.end.dateTime) {
            this.currentMeetingItem.endTime = this.$utils.formatTime(item.end.dateTime);
        }
        if (item.attendees) {
            this.currentMeetingItem.attendees = {
                total: item.attendees.length,
                yes: item.attendees.count(a => a.responseStatus === 'accepted'),
                no: item.attendees.count(a => a.responseStatus === 'notAccepted'),
                awaiting: item.attendees.count(a => a.responseStatus === 'needsAction'),
                tentative: item.attendees.count(a => a.responseStatus === 'tentative'),
                list: item.attendees
            };
        }
        if (item.hangoutLink) {
            let name = item.hangoutLink;
            if (name.lastIndexOf('/') > 0) {
                name = name.substring(name.lastIndexOf('/') + 1);
            }
            this.currentMeetingItem.videoCall = { url: item.hangoutLink, name: name };
        }
        if (this.$session.isQuickView) {
            const targetCtl = $('.app-header.navbar > button[appmobilesidebartoggler]').get(0);
            if (targetCtl) {
                jsEvent = { currentTarget: targetCtl };
            }
        }
        else if (this.currentMeetingViewItem) {
            jsEvent = { currentTarget: this.currentMeetingViewItem };
        }
        this.opEvent.show(jsEvent);
        this.calMenu.hide();
    }

    openVideoCall(meeting) {
        this.calMenu.hide();
        if (meeting && meeting.hangoutLink) {
            window.open(meeting.hangoutLink);
        }
    }

    eventClick(e) {
        const { event, jsEvent, view } = e;
        this.currentMeetingViewItem = null;
        if (event.extendedProps.entryType === 1) {
            this.showWorklogPopup(event.extendedProps.sourceObject);
        }
        else if (event.entryType === 2) {
            this.showCalendarDetails(event, jsEvent, view);
        }
        return false;
    }

    //dayClick: function (date) { console.log('dayClick', date.format()); },
    viewRender(event) {
        const { view } = event;
        this.settings.viewMode = view.type;
        this.startDate = view.activeStart;
        this.endDate = view.activeEnd;
        this.title = `Calendar - [${view.title.replace(/[^a-zA-Z0-9, ]+/g, '-')}]`;
        this.refreshData();
        //Revisit:check if this is required - $(this.calendar.el.nativeElement).find(".fc-header-toolbar").hide();
    }

    eventDrop(e) {
        const { event, revert, jsEvent } = e;

        if (jsEvent.ctrlKey || jsEvent.altKey) {
            revert();
            const eventFromArr = this.events.first(e => e.entryType === 1 && e.id === event.id);
            if (eventFromArr) {
                const srcObj = eventFromArr.sourceObject;
                eventFromArr.start = moment(new Date(srcObj.dateStarted)).toDate();
                eventFromArr.end = moment(new Date(srcObj.dateStarted))
                    .add(this.$worklog.getTimeSpent(srcObj), "minutes").toDate();
                //.add(this.$utils.getTotalSecs(srcObj.overrideTimeSpent || srcObj.timeSpent), 'seconds').toDate();
            }
            this.$worklog.copyWorklog(event.extendedProps.sourceObject, event.start)
                .then((result) => { this.addEvent({ added: result }); });
        }
        else {
            const oldDate = event.extendedProps.sourceObject.dateStarted;
            this.$worklog.changeWorklogDate(event.extendedProps.sourceObject, event.start).then((entry) => {
                //this.updateAllDayEvent({ start: oldDate }); // This is to update the info of previous date
                //event.extendedProps.sourceObject.dateStarted = event.start.toDate();
                //var evnt = this.latestData.first((e) => { return e.id === event.id && e.entryType === 1; });
                //evnt.start = event.start.toDate();
                //evnt.end = event.end.toDate();
                this.addEvent({ previousTime: oldDate, edited: entry });
                //this.updateAllDayEvent(event);
            });
        }
    }

    eventResize(e) {
        const { event } = e;
        this.$worklog.changeWorklogTS(event.extendedProps.sourceObject, this.getEventDuration(event)).then((entry) => {
            this.addEvent({ edited: entry });
            //this.updateAllDayEvent(event);
        });
    }

    getEventDuration(event) {
        if (event.end && event.start) {
            const diff = moment.duration(moment(event.end).diff(event.start));
            return `${diff.hours().pad(2)}:${diff.minutes().pad(2)}`;
        }
        else if (event.extendedProps.sourceObject) {
            const srcObj = event.extendedProps.sourceObject;
            const ts = srcObj.overrideTimeSpent || srcObj.timespent;
            if (ts && ~ts.indexOf(':')) {
                return ts;
            }
        }
        return '00:00';
    }

    eventRender(e) {
        const { event, el } = e;
        const element = $(el);
        const hourDiff = ` (${this.$utils.formatTs(this.getEventDuration(event))})`;
        const srcObj = event.extendedProps.sourceObject;
        if (srcObj) {
            const title = `${element.find(".fc-time").text() + hourDiff}\n${event.title}`;
            element.attr('title', title);
        }

        element.find(".fc-time").append(`<span class="fc-hour">${hourDiff}</span>`);
        const entryType = event.extendedProps.entryType;
        if (entryType === 1) {
            const w = srcObj;

            const contextEvent = (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.mnuWL_Upload.disabled = w.isUploaded;
                this.currentWLItem = w;
                showContextMenu(e, this.contextMenuItems);
                //this.contextMenu.toggle(e);
            };

            const icon = $('<i class="fa fa-ellipsis-v pull-left" title="Show options"></i>')
                .on('click', contextEvent);
            element.find(".fc-time").prepend(icon);
            element.bind('contextmenu', contextEvent);
        }
        else if (entryType === 2) {
            let icon = null;
            const m = srcObj;
            const hasWorklog = this.latestData.some((e) => { return e.parentId === event.id && e.entryType === 1; });
            if (!hasWorklog) {
                icon = $('<i class="fa fa-clock-o pull-left" title="Create worklog for this meeting"></i>')
                    .on('click', (e) => { e.stopPropagation(); this.createWorklog(e, m, this.defaultMeetingTicket); });
            }
            else {
                icon = $('<i class="fa fa-ellipsis-v pull-left" title="Show options"></i>')
                    .on('click', (e) => { e.stopPropagation(); element.trigger('contextmenu'); });
            }
            const timeItem = element.find(".fc-time");
            timeItem.prepend(icon);
            element.bind('contextmenu', (e) => {
                e.stopPropagation();
                e.preventDefault();
                e.currentTarget = icon.get(0);
                this.currentMeetingItem = m;
                this.calMenu.hide();
                this.currentMeetingViewItem = timeItem.find('i.fa').get(0);
                this.mnuCal_AddWL.disabled = hasWorklog;
                this.mnuCal_OpenUrl.disabled = !m.hangoutLink;
                this.calMenu.toggle(e);
            });
        }
    }

    uploadWorklog(all) {
        this.setState({ uploading: true });

        hideContextMenu();
        if (all) {
            const worklogs = this.getPendingWorklogs().map(e => e.sourceObject.id);
            this.$worklog.uploadWorklogs(worklogs)
                .then(() => {
                    this.$message.success(`${worklogs.length} worklog(s) uploaded successfully!`);
                    this.refreshData();
                }, () => {
                    this.refreshData();
                });
        }
        else {
            this.$worklog.uploadWorklogs([this.currentWLItem.id])
                .then(() => this.$worklog.getWorklog(this.currentWLItem.id))
                .then((wl) => {
                    this.setState({ uploading: false });
                    this.$message.success("Worklog uploaded successfully!");
                    // ToDo: update latestData collection also for is uploaded flag
                    this.addEvent({ added: this.$worklog.getWLCalendarEntry(wl) });
                }, () => this.setState({ uploading: false }));
        }
    }

    deleteWorklog() {
        hideContextMenu();
        this.$worklog.deleteWorklog(this.currentWLItem).then(() => {
            this.addEvent({
                removed: this.currentWLItem.id,
                deletedObj: this.currentWLItem
            });
        });
    }

    copyWorklog() {
        hideContextMenu();
        const newObj = Object.create(this.currentWLItem);
        newObj.copy = true;
        this.showWorklogPopup({ copy: newObj });
    }

    getPendingWorklogs(events) {
        if (!events) { events = this.events; }

        return events.filter(e => e.entryType === 1 && !e.sourceObject.isUploaded);
    }

    executeEvent(action) {
        if (action.type === GadgetActionType.AddWorklog || action.type === GadgetActionType.DeletedWorklog || action.type === GadgetActionType.WorklogModified) {
            this.refreshData();
        }
        else {
            super.executeEvent(action);
        }
    }

    saveSettings() {
        if (this.isGadget) {
            return;
        }
        this.$session.pageSettings.calendar = this.settings;
        this.refreshData();
        this.$config.saveSettings('calendar');
    }

    renderCustomActions() {
        const {
            isGadget,
            state: { pendingWorklogCount, isLoading, uploading }
        } = this;

        return <>
            {!this.isGadget && <>
                <Button icon="fa fa-arrow-left" onClick={() => this.calendar.prev()} />
                <Button icon="fa fa-arrow-right" onClick={() => this.calendar.next()} />
                <SelectBox dataset={viewModes} value={this.settings.viewMode} valueField="value" displayField="label" placeholder="Select a view mode" onChange={this.viewModeChanged} />
            </>}
            <span className="info-badge" title={pendingWorklogCount ? `Upload ${pendingWorklogCount} pending worklog(s)` : 'No worklog pending to be uploaded'}>
                {pendingWorklogCount > 0 && <span className="info btn-warning">{pendingWorklogCount}</span>}
                <Button type="success" icon={uploading ? 'fa fa-spin fa-spinner' : 'fa fa-upload'} disabled={uploading || pendingWorklogCount < 1 || isLoading} onClick={() => this.uploadWorklog(true)} />
            </span>
            {!isGadget && <Button icon="fa fa-refresh" disabled={isLoading || uploading} onClick={this.refreshData} title="Refresh meetings and worklogs" />}
            {!isGadget && <Button icon="fa fa-cogs" onClick={() => this.setState({ showSettings: true })} title="Show settings" />}
        </>;
    }

    render() {
        const {
            hideWorklogDialog, addEvent,
            state: { showAddWorklogPopup, worklogItem, events }
        } = this;

        return super.renderBase(<>
            <FullCalendar ref={(el) => { if (!el) { return; } this.fc = el; this.calendar = el.calendar; }} events={events} options={this.fullCalendarOpts} />
            {showAddWorklogPopup && <AddWorklog worklog={worklogItem} onDone={addEvent} onHide={hideWorklogDialog} />}
        </>
        );
    }
}

export default Calendar;