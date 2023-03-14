import React from 'react';
import * as moment from 'moment';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listWeekPlugin from '@fullcalendar/list';
import momentPlugin from '@fullcalendar/moment';
import interactionPlugin from '@fullcalendar/interaction';
import config from '../../customize';
import BaseGadget from '../BaseGadget';
import { inject } from '../../services/injector-service';
import { GadgetActionType } from '../_constants';
import Button from '../../controls/Button';
import SelectBox from '../../controls/SelectBox';
import { hideContextMenu, showContextMenu } from '../../externals/jsd-report';
import AddWorklog from '../../dialogs/AddWorklog';
import { OverlayPanel } from 'primereact/overlaypanel';
import MeetingDetails from './MeetingDetails';
import CalendarSettings from './Settings';
import { DefaultEndOfDay, DefaultStartOfDay, DefaultWorkingDays, EventCategory, momentizedDateFormats } from '../../constants/settings';
import { WorklogContext } from '../../common/context';
import ChangeTracker from '../../components/ChangeTracker';
import './Calendar.scss';

const viewModes = [
    { value: 'dayGridMonth', label: 'Month' }, { value: 'timeGridWeek', label: 'Week' }, { value: 'timeGridDay', label: 'Day' },
    { value: 'listMonth', label: 'Month List' }, { value: 'listWeek', label: 'Week List' }, { value: 'listDay', label: 'Day List' },
    { value: 'dayGridWeek', label: 'Grid Week' }, { value: 'dayGridDay', label: 'Grid Day' }
];

const availablePlugins = [dayGridPlugin, timeGridPlugin, interactionPlugin, listWeekPlugin, momentPlugin];

const { googleCalendar, outlookCalendar } = config.features.integrations;
const showMeetings = outlookCalendar !== false || googleCalendar !== false;

const meetingInfo = showMeetings && (<>
    <li>One click <span className="fa fa-clock-o" /> icon to create worklog entry for meetings</li>
    <li>You can set "Default meeting ticket" in General Settings &#8680; Worklog tab</li>
</>);

const snapMinutes = 15;

class Calendar extends BaseGadget {
    static contextType = WorklogContext;
    constructor(props) {
        super(props, "Calendar", "fa-calendar");
        inject(this, "SessionService", "WorklogService", "MessageService", "AnalyticsService", "OutlookService", "CalendarService",
            "UtilsService", "UserUtilsService", "ConfigService", "TicketService", "AppBrowserService");

        this.hideMenu = !props.isGadget;
        this.hideRefresh = true;
        this.hideExport = true;

        if (this.$session.pageSettings.calendar) {
            this.state.settings = Object.assign({ showMeetings: true, showWorklogs: true, showInfo: true }, this.$session.pageSettings.calendar);
        }
        else {
            this.state.settings = { viewMode: 'timeGridWeek', showMeetings: true, showWorklogs: true, showInfo: true };
        }
        this.setGadgetClass(this.state.settings);
        this.setMenuItems();

        this.CurrentUser = this.$session.CurrentUser;
        //this.defaultView = this.state.settings.viewMode || "month";
        this.maxTime = this.CurrentUser.maxHours;
        this.minTime = this.CurrentUser.minHours || this.maxTime;
        this.dateFormat = this.CurrentUser.dateFormat;
        if (this.maxTime) {
            this.maxTime = this.maxTime * 60 * 60;
        }
        if (this.minTime) {
            this.minTime = this.minTime * 60 * 60;
        }

        this.fullCalendarOpts = this.getCalendarOptions(this.state);

        //moment = (date) => toMoment(date, this.calendar)
    }

    setGadgetClass({ rowBanding }) {
        const addlClass = rowBanding ? ' cal-row-banding' : '';
        if (this.props.isGadget) {
            this.className = `calendar-view${addlClass}`;
        } else {
            this.className = addlClass;
        }
    }

    getHint() {
        return (<ul className="gadget-hint">
            <li>Pressing left Alt + drag drop worklog will copy the worklog to target slot</li>
            {meetingInfo}
            <li>Drag and drop or resize the worklog to edit it</li>
            <li>Right click worklog to see more options</li>
            <li>You can change the hours grid in calendar by changing the working<br />and display hours in General Settings page</li>
        </ul>);
    }

    async setMenuItems() {
        this.mnuWL_Upload = { label: "Upload worklog", icon: "fa fa-upload", command: () => this.uploadWorklog() };

        this.contextMenuItems = [
            { label: "Edit worklog", icon: "fa fa-edit", command: () => this.showWorklogPopup(this.currentWLItem) },
            { label: "Open ticket", icon: "fa fa-external-link", command: () => this.openTicket(this.currentWLItem) },
            { label: "Copy worklog", icon: "fa fa-copy", command: () => this.copyWorklog() },
            this.mnuWL_Upload,
            { label: "Delete worklog", icon: "fa fa-times", command: () => this.deleteWorklog() }
        ];

        const meetingTicket = (this.$session.CurrentUser.meetingTicket || "").trim().split(',').map(t => t.trim()).filter(Boolean);
        const ticketDetails = await this.$ticket.getTicketDetails(meetingTicket);

        const wlTickets = [];
        if (meetingTicket.length > 0) {
            meetingTicket.forEach(t => {
                const { fields: { summary = "" } = {} } = ticketDetails[t.toUpperCase()] || {};

                wlTickets.push({
                    label: summary ? `${t}: ${this.$utils.cut(summary, 65, true)}` : t, icon: "fa fa-ticket",
                    command: (e) => this.createWorklog(e.originalEvent, this.currentMeetingItem, t)
                });
            });
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
            { label: "Show details", icon: "fa fa-info-circle", command: (e) => this.showCalendarDetails({ extendedProps: this.currentMeetingExtdProps }, e.originalEvent, null) },
            this.mnuCal_OpenUrl
        ];
    }

    getDayHeaderFormat(viewMode) {
        if (viewMode === 'dayGridMonth') {
            return undefined;
        }

        let dayHeaderFormat = this.dateFormat ? momentizedDateFormats[this.dateFormat] : undefined;
        if (dayHeaderFormat) {
            dayHeaderFormat = dayHeaderFormat.replace('YYYY', '').replace(/-/g, '/').clearStart(['/', ',', ' ']).clearEnd(['/', ',', ' ']);
            if (!dayHeaderFormat.includes('ddd')) {
                dayHeaderFormat = `ddd, ${dayHeaderFormat}`;
            }
        }

        return dayHeaderFormat;
    }

    getCalendarOptions({ fullView, zoomIn }) {
        const {
            startOfDay, endOfDay,
            startOfWeek, workingDays,
            timeFormat
        } = this.CurrentUser;
        const { viewMode } = (this.isGadget ? this.props : this.state.settings);
        const { hideWeekends } = this.state.settings;
        const { startOfDayDisp, endOfDayDisp } = fullView ? { startOfDayDisp: '00:00', endOfDayDisp: '23:59' } : this.CurrentUser;

        let firstDay = startOfWeek;
        if (firstDay && firstDay > 0) {
            firstDay = firstDay - 1;
        }
        else {
            firstDay = null;
        }

        const hour12 = (timeFormat || "").indexOf("tt") > -1;
        const meridiem = hour12 ? "short" : false;


        const allWeekDays = [0, 1, 2, 3, 4, 5, 6];
        let hiddenDays = hideWeekends ? allWeekDays.filter(v => !workingDays.includes(v)) : [];
        if (hiddenDays?.length === 7) {
            hiddenDays = [];
        }

        return {
            plugins: availablePlugins,
            timeZone: 'local',
            // selectHelper: true, //ToDo: need to check what is this // ToDo: Prop changed

            weekends: true,
            hiddenDays,

            titleFormat: this.dateFormat ? momentizedDateFormats[this.dateFormat] : undefined,
            dayHeaderFormat: this.getDayHeaderFormat(viewMode),
            eventMinHeight: 40,

            // Event Display
            displayEventTime: true,

            // Date Clicking & Selecting
            selectable: true,

            // International
            firstDay,

            // Sizing
            height: "100%",

            // Month view
            fixedWeekCount: false,

            // Event Popover
            dayMaxEventRows: true,

            // Event Dragging & Resizing
            editable: true,
            droppable: true,

            // Time-Axis Settings
            slotDuration: zoomIn ? '00:05:00' : '00:15:00',
            slotMinTime: startOfDayDisp || startOfDay || DefaultStartOfDay, //"08:00:00",
            slotMaxTime: endOfDayDisp || endOfDay || DefaultEndOfDay, //"22:00:00",

            // TimeGrid View
            allDayText: "total",

            // Toolbar
            headerToolbar: false,

            // Now Indicator
            nowIndicator: true,

            // Date Nav Links
            navLinks: true,

            // View API
            initialView: viewMode,

            // Business Hours
            businessHours: {
                // days of week. an array of zero-based day of week integers (0=Sunday)
                daysOfWeek: workingDays || DefaultWorkingDays,
                startTime: startOfDay || DefaultStartOfDay,
                endTime: endOfDay || DefaultEndOfDay,
            },

            // Reference - https://fullcalendar.io/docs/date-formatting
            //columnHeaderFormat: { weekday: 'short', month: 'numeric', day: 'numeric', omitCommas: true },
            slotLabelFormat: { hour: 'numeric', minute: '2-digit', omitZeroMinute: hour12, meridiem, hour12 },
            eventTimeFormat: { hour: 'numeric', minute: '2-digit', omitZeroMinute: hour12, meridiem, hour12 },

            // Functions
            select: this.select.bind(this),
            //viewSkeletonRender: this.viewRender.bind(this),
            datesSet: this.viewRender.bind(this),
            eventDrop: this.eventDrop.bind(this),
            eventResize: this.eventResize.bind(this),
            eventClick: this.eventClick,
        };
    }

    UNSAFE_componentWillReceiveProps(newProps) {
        if (newProps.viewMode) {
            this.setState({ settings: { ...this.state.settings, viewMode: newProps.viewMode } });
            //this.viewModeChanged();
        }
        super.UNSAFE_componentWillReceiveProps(newProps);
    }

    refreshData = () => this.fillEvents(this.startDate, this.endDate);

    viewModeChanged = (viewMode) => {
        this.setState({ viewMode });
        this.fullCalendarOpts.dayHeaderFormat = this.getDayHeaderFormat(viewMode);
        this.calendar.getApi().changeView(viewMode);
        this.saveSettings({ ...this.state.settings, viewMode }, true);
    };

    createWorklog($event, m, mTicket) {
        hideContextMenu();

        if (!m.start.dateTime) {
            return;
        }

        $event.stopPropagation();
        $event.preventDefault();

        const diff = moment.duration(moment(m.end.dateTime).diff(m.start.dateTime));

        const obj = {
            dateStarted: m.start.dateTime,
            timeSpent: `${diff.hours().pad(2)}:${diff.minutes().pad(2)}`,
            description: m.subject || m.summary,
            parentId: m.id
        };

        if (mTicket) {
            obj.ticketNo = mTicket;
            this.$worklog.saveWorklog(obj).then((entry) => {
                this.addEvent({ added: entry });
                $event.currentTarget?.remove();
            }, e => {
                if (typeof e === "string") {
                    this.$message.error(e);
                } else {
                    console.error(e);
                }
            });
            this.$analytics.trackEvent("Quick add WL", EventCategory.UserActions);
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
            const ps = this.state.settings;
            if (ps.showMeetings) { types.push(2); }
            if (ps.showWorklogs) { types.push(1); }
            if (ps.showInfo) { types.push(3); }
            switch (types.length) {
                case 0:
                    data = [];
                    break;
                case 3: break;
                default:
                    data = data.filter((e) => types.indexOf(e.entryType) > -1);
                    break;
            }

            this.setColors(data);
            this.setEventsData(data);
        };

        const req = [this.$worklog.getWorklogsEntry(start, end, ['worklog', 'summary'])];

        if (this.CurrentUser.googleIntegration && this.CurrentUser.hasGoogleCredentials && this.state.settings.showMeetings) {
            req.push(this.$calendar.getEvents(start, end).then(null, (err) => {
                let msg = "Unable to fetch Google meetings!";
                if (err.error && err.error.message) {
                    msg += `<br /><br />Reason:- ${err.error.message}`;
                }
                this.$message.warning(msg);
                return [];
            }));
        }

        if (this.CurrentUser.outlookIntegration && this.CurrentUser.hasOutlookCredentials && this.state.settings.showMeetings) {
            req.push(this.$outlook.getEvents(start, end).then(null, (err) => {
                let msg = "Unable to fetch Outlook meetings!";
                if (err.error && err.error.message) {
                    msg += `<br /><br />Reason:- ${err.error.message}`;
                }
                this.$message.warning(msg);
                return [];
            }));
        }

        this.setState({ isLoading: true, uploading: false });

        Promise.all(req).then((arr) => {

            this.setState({ isLoading: false });

            const data = arr[0];
            const allDayEvents = data.filter((d) => d.entryType === 1)
                .groupBy((key) => moment(key.start).format("YYYY-MM-DD"))
                .map((d) => this.getAllDayObj(d));

            this.latestData = data;

            filter(data.addRange(allDayEvents).addRange(arr[1]));
        }, (err) => { this.setState({ isLoading: false }); return Promise.reject(err); });
    }

    setLoggedTime(arr, obj) {
        const time = this.getTimeSpent(arr);
        obj.logged = time;
        if (time > this.maxTime) {
            obj.diff = time - this.maxTime;
        } else if (time < this.minTime) {
            obj.diff = time - this.minTime;
        } else {
            obj.diff = 0;
        }
        this.setInfoColor(obj, this.state.settings);
        obj.title = this.getLoggedTimeTitle(time, obj.diff);
        return obj;
    }

    getLoggedTimeTitle(time, diff) {
        const { formatSecs } = this.$utils;
        let title = `Logged: ${formatSecs(time)}`;

        if (diff) {
            title += ` (${diff > 0 ? "+" : "-"}${formatSecs(Math.abs(diff))})`;
        }

        return title;
    }

    setInfoColor(obj, ps) {
        if (obj.diff) {
            obj.backgroundColor = obj.diff > 0 ? ps.infoColor_high : ps.infoColor_less;
        }
        else {
            obj.backgroundColor = ps.infoColor_valid;
        }
        obj.borderColor = obj.backgroundColor;
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
        const { events } = this.state;
        events.removeAll((e) => e.id === key && e.entryType === 3);
        const logs = events.filter((a) => a.entryType === 1 && moment(a.start).format("YYYY-MM-DD") === key);
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

    hideWorklogDialog = () => this.setState({ showAddWorklogPopup: false });
    toggleSettingsDialog = () => this.setState({ showSettingsPopup: !this.state.showSettingsPopup });

    openTicket(obj) {
        const url = this.$userutils.getTicketUrl(obj.ticketNo);
        this.$jaBrowserExtn.openTab(url);
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
        const { events } = this.state;

        if (result.removed) {
            const removedId = result.removed + (result.deletedObj.worklogId ? `#${result.deletedObj.worklogId}` : "");
            result = events.first((e) => e.id === removedId && e.entryType === 1);
            events.remove(result);
            this.latestData.remove((e) => e.id === result.id && e.entryType === 1);
        }
        else if (result.added || result.edited) {
            const previousTime = result.previousTime;
            result = result.added || result.edited;
            result.backgroundColor = this.state.settings.worklogColor; // Set color for newely added worklog
            result.borderColor = result.backgroundColor;
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
    };

    setEventsData(events) {
        this.setState({ isLoading: false, events: [...events], pendingWorklogCount: this.getPendingWorklogs(events).length });
    }

    getAllDayObj(d) {
        return this.setLoggedTime(d.values, {
            id: d.key, entryType: 3, start: d.key,
            allDay: true, editable: false
        });
    }

    setColors(data) {
        const ps = this.state.settings;
        const wc = ps.worklogColor, ec = ps.eventColor;

        data.forEach((w) => {
            switch (w.entryType) {
                case 1:
                    w.backgroundColor = wc;
                    w.borderColor = wc;
                    break; // Set color for worklogs
                case 2:
                    w.backgroundColor = ec;
                    w.borderColor = ec;
                    break; // Set color for events
                case 3:
                    this.setInfoColor(w, ps);
                    break; // Set color for info
                default: break;
            }
        });
    }

    select({ start, end, allDay }) {
        const isMonthMode = this.state.settings.viewMode === "dayGridMonth" && !this.isGadget;

        if (!isMonthMode && allDay) {// start.hasTime() ==> allDay
            return false;
        }

        this.$analytics.trackEvent("Worklog drag", EventCategory.UserActions);

        this.showWorklogPopup({ isMonthMode: isMonthMode, start: moment(start), end: moment(end) });
        return false;
    }

    showCalendarDetails(event, jsEvent, view) {
        hideContextMenu();
        jsEvent.preventDefault();
        jsEvent.stopPropagation();
        const item = event.extendedProps.sourceObject;

        this.$analytics.trackEvent("View event details", EventCategory.UserActions, event.extendedProps.source);

        if (event.extendedProps.source === "goolge") {
            this.currentMeetingItem = this.getGoogleEventView(item);
        }
        else if (event.extendedProps.source === "outlook") {
            this.currentMeetingItem = this.getOutlookEventView(item);
        }

        if (this.$session.isQuickView) {
            const targetCtl = document.body.querySelector('.app-header.navbar > button[appmobilesidebartoggler]');
            if (targetCtl) {
                jsEvent = { currentTarget: targetCtl };
            }
        }
        else if (this.currentMeetingViewItem) {
            jsEvent = { currentTarget: this.currentMeetingViewItem };
        }

        this.opEvent.show(jsEvent);
        this.setState({ showOpEvent: true });
    }

    getGoogleEventView(item) {
        const currentMeetingItem = {
            summary: item.summary,
            htmlLink: item.htmlLink,
            location: item.location,
            description: item.description,
            descrLimit: 350,
            creator: item.creator,
            organizer: item.organizer
        };

        if (item.start) {
            currentMeetingItem.date = this.$userutils.formatDate(item.start.dateTime);
            currentMeetingItem.startTime = this.$userutils.formatTime(item.start.dateTime);
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
            currentMeetingItem.remaining = remaining;
        }

        if (item.end && item.end.dateTime) {
            currentMeetingItem.endTime = this.$userutils.formatTime(item.end.dateTime);
        }

        if (item.attendees) {
            currentMeetingItem.attendees = {
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
            currentMeetingItem.videoCall = { url: item.hangoutLink, name: name };
        }

        return currentMeetingItem;
    }

    getOutlookEventView(item) {
        const currentMeetingItem = {
            summary: item.subject,
            htmlLink: item.webLink,//Verify
            location: (item.location || {}).displayName,
            description: item.bodyPreview,
            descrLimit: 350,
            creator: item.creator,
            organizer: ((item.organizer || {}).emailAddress || {}).name
        };

        if (item.start) {
            currentMeetingItem.date = this.$userutils.formatDate(item.start.dateTime);
            currentMeetingItem.startTime = this.$userutils.formatTime(item.start.dateTime);
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
            currentMeetingItem.remaining = remaining;
        }

        if (item.end && item.end.dateTime) {
            currentMeetingItem.endTime = this.$userutils.formatTime(item.end.dateTime);
        }

        if (item.attendees) {
            currentMeetingItem.attendees = {
                total: item.attendees.length,
                yes: item.attendees.count(a => (a.status || {}).response === 'accepted'),
                no: item.attendees.count(a => (a.status || {}).response === 'notAccepted'),
                awaiting: item.attendees.count(a => (a.status || {}).response === 'needsAction'),
                tentative: item.attendees.count(a => (a.status || {}).response === 'tentative'),
                list: item.attendees.map(a => {
                    const { emailAddress: { address: email, name: displayName } } = a;

                    return { email, displayName };
                })
            };
        }

        if (item.onlineMeetingUrl) {
            let name = item.onlineMeetingUrl;
            if (name.lastIndexOf('/') > 0) {
                name = name.substring(name.lastIndexOf('/') + 1);
            }
            currentMeetingItem.videoCall = { url: item.onlineMeetingUrl, name: name };
        }

        return currentMeetingItem;
    }

    hideOPEvent = () => this.setState({ showOpEvent: false });

    openVideoCall(meeting) {
        hideContextMenu();
        if (meeting && meeting.hangoutLink) {
            this.$jaBrowserExtn.openTab(meeting.hangoutLink);
        }
    }

    eventClick = (e) => {
        const { event, jsEvent, view } = e;

        if (jsEvent.target.hasAttribute('event-icon')) {
            return false;
        }

        this.currentMeetingViewItem = null;

        if (event.extendedProps.entryType === 1) {
            this.showWorklogPopup(event.extendedProps.sourceObject);
        }
        else if (event.extendedProps.entryType === 2) {
            this.currentMeetingViewItem = jsEvent.srcElement;
            this.showCalendarDetails(event, jsEvent, view);
        }

        return false;
    };

    //dayClick: function (date) { console.log('dayClick', date.format()); },
    viewRender(event) {
        const { view } = event;
        this.startDate = view.activeStart;
        this.endDate = view.activeEnd;
        this.title = `Calendar - [${view.title.replace(/[^a-zA-Z0-9, /]+/g, '-')}]`;
        this.saveSettings({ ...this.state.settings, viewMode: view.type });
    }

    eventDrop(e) {
        const { event, revert, jsEvent } = e;
        const eventSrcObj = event.extendedProps.sourceObject;
        const isCopy = jsEvent.ctrlKey || jsEvent.altKey;

        if (!isCopy && eventSrcObj.isUploaded) {
            const icon = e.el.querySelector('i.fa-ellipsis-v');
            if (icon) {
                icon.classList.replace('fa-ellipsis-v', 'fa-refresh');
                icon.classList.add('fa-spin');
            }
            revert();
        }

        if (isCopy) {
            revert();
            const eventFromArr = this.state.events.first(e => e.entryType === 1 && e.id === event.id);
            if (eventFromArr) {
                const srcObj = eventFromArr.sourceObject;
                eventFromArr.start = moment(new Date(srcObj.dateStarted)).toDate();
                eventFromArr.end = moment(new Date(srcObj.dateStarted))
                    .add(this.$worklog.getTimeSpent(srcObj), "minutes").toDate();
                //.add(this.$utils.getTotalSecs(srcObj.overrideTimeSpent || srcObj.timeSpent), 'seconds').toDate();
            }
            this.$worklog.copyWorklog(eventSrcObj, event.start)
                .then((result) => {
                    this.addEvent({ added: result });
                    this.$analytics.trackEvent("Worklog quick copied", EventCategory.UserActions, eventSrcObj.isUploaded ? "Uploaded worklog" : "Pending worklog");
                });
        }
        else {
            const oldDate = eventSrcObj.dateStarted;
            const newTime = snapTimeToGrid(snapMinutes, event.start);
            this.$worklog.changeWorklogDate(eventSrcObj, newTime).then((entry) => {
                this.$analytics.trackEvent("Worklog moved", EventCategory.UserActions, eventSrcObj.isUploaded ? "Uploaded worklog" : "Pending worklog");
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
        this.$worklog.changeWorklogTS(event.extendedProps.sourceObject, this.getEventDuration(event, true)).then((entry) => {
            this.addEvent({ edited: entry });
            this.$analytics.trackEvent("Worklog resized", EventCategory.UserActions, event.extendedProps.sourceObject.isUploaded ? "Uploaded worklog" : "Pending worklog");
            //this.updateAllDayEvent(event);
        });
    }

    getEventDuration(event, snap) {
        if (event.end && event.start) {
            const newTime = snap ? snapTimeToGrid(snapMinutes, event.end) : event.end;
            const diff = moment.duration(moment(newTime).diff(event.start));
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

    renderEventContent = (e) => {
        const { timeText, event, view: { type } } = e;
        const { entryType, logged, diff } = event.extendedProps;

        if (entryType === 3) { return <span className="pad-l-5">{this.getLoggedTimeTitle(logged, diff)}</span>; }

        const hourDiff = ` (${this.$utils.formatTs(this.getEventDuration(event))})`;
        const srcObj = event.extendedProps.sourceObject;
        let evTitle = event.title;
        let subTitle = '', title;

        if (entryType === 1) {
            const { detailsMode } = this.state.settings;

            if (detailsMode === '2') {
                evTitle = `${srcObj?.ticketNo} - ${srcObj?.summary}`;
            } else if (detailsMode === '3') {
                subTitle = srcObj?.summary;
            }
        }

        if (srcObj) {
            title = `${timeText} ${hourDiff}\n${evTitle}`;
        }

        let leftIcon;
        let contextEvent;

        if (entryType === 1) {
            const w = srcObj;

            contextEvent = (e) => {
                this.mnuWL_Upload.disabled = w.isUploaded;
                this.currentWLItem = w;
                showContextMenu(e, this.contextMenuItems);
                //this.contextMenu.toggle(e);
            };

            leftIcon = (<i className="fa fa-ellipsis-v pull-left" title="Show options" onClick={contextEvent} event-icon="true"></i>);
        }
        else if (entryType === 2) {
            const m = srcObj;
            const hasWorklog = this.latestData.some((e) => e.parentId === event.id && e.entryType === 1);

            contextEvent = (e, a, d) => {
                //hideContextMenu();
                e.stopPropagation();
                e.preventDefault();

                this.currentMeetingItem = m;
                this.currentMeetingExtdProps = event.extendedProps;

                this.mnuCal_AddWL.disabled = hasWorklog;
                this.mnuCal_OpenUrl.disabled = !m.hangoutLink;
                showContextMenu(e, this.calMenuItems);
            };

            if (!hasWorklog) {
                leftIcon = (<i className="fa fa-clock-o pull-left" title="Create worklog for this meeting" event-icon="true"
                    onClick={(e) => { e.stopPropagation(); this.createWorklog(e, m, this.defaultMeetingTicket); }}></i>);
            }
            else {
                leftIcon = <i className="fa fa-ellipsis-v pull-left" title="Show options" onClick={contextEvent} event-icon="true"></i>;
            }
        }

        if (type === 'timeGridWeek' || type === 'timeGridDay') {
            const lines = (evTitle ? 3 : 0) + (subTitle ? 3 : 0);
            const clsName = (lines * 30 > srcObj.totalMins ? ' short-desc' : '');

            return (<div ref={(e) => e?.parentElement?.parentElement?.addEventListener('contextmenu', contextEvent)}
                className="fc-content pad-8" title={title} data-jira-key={srcObj?.ticketNo} data-jira-wl-id={srcObj?.worklogId}>
                {entryType === 1 && <WorklogOptions worklog={srcObj} onUpload={this.uploadSelectedWorklog} onClone={this.cloneWorklog} />}
                {leftIcon}
                <div className="fc-time">
                    <span>{timeText}</span>
                    <span className="fc-hour"> {hourDiff}</span>
                </div>
                <div className={`fc-title${clsName}`}>{evTitle}</div>
                {!!subTitle && <div className={`fc-sub-title${clsName}`} title={subTitle}>{subTitle}</div>}
            </div>);
        }

        return true;
    };

    async uploadWorklog(all) {
        this.setState({ uploading: true });

        hideContextMenu();
        if (all) {
            try {
                const worklogs = this.getPendingWorklogs().map(e => e.sourceObject.id);
                await this.$worklog.uploadWorklogs(worklogs);
                this.$message.success(`${worklogs.length} worklog(s) uploaded successfully!`);
                this.$analytics.trackEvent("Worklog uploaded: All", EventCategory.UserActions);
            } catch (err) {
                if (err.message || err.response) {
                    this.$message.error(err.message || err.response);
                }
            }
            finally {
                this.refreshData();
            }
        }
        else {
            this.uploadSelectedWorklog(this.currentWLItem.id);
        }
    }

    uploadSelectedWorklog = async (id) => {
        try {
            this.setState({ uploading: true });
            const wl = await this.$worklog.uploadWorklogs([id], true);
            this.setState({ uploading: false });
            this.$message.success("Worklog uploaded successfully!");
            // ToDo: update latestData collection also for is uploaded flag
            const { events } = this.state;
            events.removeAll(w => w.entryType === 1 && w.id.toString() === id.toString());
            this.addEvent({ added: this.$worklog.getWLCalendarEntry(wl[0]) });
            this.$analytics.trackEvent("Worklog uploaded: Individual", EventCategory.UserActions);
        } catch (err) {
            if (err.message || err.response) {
                this.$message.error(err.message || err.response);
            }
        } finally {
            this.setState({ uploading: false });
        }
    };

    deleteWorklog() {
        hideContextMenu();
        this.$worklog.deleteWorklog(this.currentWLItem).then(() => {
            this.$analytics.trackEvent("Worklog deleted", EventCategory.UserActions, this.currentWLItem.isUploaded ? "Uploaded worklog" : "Pending worklog");
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

    cloneWorklog = async (worklog) => {
        try {
            const added = await this.$worklog.copyWorklog(worklog);
            this.addEvent({ added });
            this.$message.success("Worklog cloned!");
            this.$analytics.trackEvent("Worklog Cloned: Individual", EventCategory.UserActions);
        }
        catch (err) {
            this.$message.error(err.message, 'Clone failed');
        }
    };

    getPendingWorklogs(events) {
        if (!events) { events = this.state.events; }

        return events.filter(e => e.entryType === 1 && !e.sourceObject.isUploaded);
    }

    executeEvent(action) {
        if (action.type === GadgetActionType.AddWorklog || action.type === GadgetActionType.DeletedWorklog || action.type === GadgetActionType.WorklogModified) {
            this.refreshData();
        }
    }

    saveSettings = (settings, noRefresh) => {
        if (this.isGadget) {
            super.saveSettings();

            if (noRefresh !== true) {
                this.refreshData();
            }

            return;
        }

        this.$session.pageSettings.calendar = settings;
        this.setGadgetClass(settings);
        this.setState({ settings }, (noRefresh !== true ? this.refreshData : null));

        this.$config.saveSettings('calendar', settings);
    };

    toggleDisplayHours = () => this.setState(state => this.updateOpts(state, { fullView: !state.fullView }));
    toggleZoom = () => this.setState(state => this.updateOpts(state, { zoomIn: !state.zoomIn }));

    updateOpts(state, newState) {
        this.fullCalendarOpts = this.getCalendarOptions({ ...state, ...newState });
        return newState;
    }

    today = () => this.calendar.getApi().today();

    renderCustomActions() {
        const {
            isGadget,
            state: { pendingWorklogCount, isLoading, uploading, fullView, zoomIn, settings: { viewMode } }
        } = this;
        const isGridMode = viewMode === 'timeGridWeek' || viewMode === 'timeGridDay';
        return <>
            {isGridMode && <Button type="secondary" icon={fullView ? 'fa fa-compress' : 'fa fa-expand'} onClick={this.toggleDisplayHours}
                title={fullView ? "Click to show only working hours in calendar" : "Click to show full day calendar"} />}
            <Button label="Today" onClick={this.today} title="Navigate to current week" />
            <Button onClick={this.toggleZoom} icon={zoomIn ? "fa fa-search-minus" : "fa fa-search-plus"}
                title={zoomIn ? "Zoom out to see 15 mins grid" : "Zoom in to see 5 mins grid"} />
            {!this.isGadget && <>
                <Button icon="fa fa-arrow-left" onClick={() => this.calendar.getApi().prev()} />
                <Button icon="fa fa-arrow-right" onClick={() => this.calendar.getApi().next()} />
                <SelectBox dataset={viewModes} value={viewMode} valueField="value" displayField="label" style={{ width: '120px' }} onChange={this.viewModeChanged} />
            </>}
            <span className="info-badge" title={pendingWorklogCount ? `Upload ${pendingWorklogCount} pending worklog(s)` : 'No worklog pending to be uploaded'}>
                {pendingWorklogCount > 0 && <span className="info btn-warning">{pendingWorklogCount}</span>}
                <Button type="success" icon={uploading ? 'fa fa-spin fa-spinner' : 'fa fa-upload'} disabled={uploading || pendingWorklogCount < 1 || isLoading} onClick={() => this.uploadWorklog(true)} />
            </span>
            <Button icon="fa fa-refresh" disabled={isLoading || uploading} onClick={this.refreshData} title="Refresh meetings and worklogs" />
            {!isGadget && <Button icon="fa fa-cogs" onClick={this.toggleSettingsDialog} title="Show settings" />}
        </>;
    }

    setCalRef = (el) => this.calendar = el;

    render() {
        const {
            hideWorklogDialog, addEvent,
            state: { showAddWorklogPopup, showSettingsPopup, worklogItem, events, showOpEvent, isLoading }
        } = this;

        return super.renderBase(<>
            <FullCalendar ref={this.setCalRef} events={events} {...this.fullCalendarOpts}
                eventContent={this.renderEventContent}
            />
            {showAddWorklogPopup && <AddWorklog worklog={worklogItem} onDone={addEvent} onHide={hideWorklogDialog} />}
            {showSettingsPopup && <CalendarSettings settings={this.state.settings} onDone={this.saveSettings} onHide={this.toggleSettingsDialog} />}

            <OverlayPanel className="op-event-details" ref={(el) => { this.opEvent = el; }} showCloseIcon={true} dismissable={true} appendTo={document.body} onHide={this.hideOPEvent}>
                {showOpEvent && this.currentMeetingItem && <MeetingDetails eventDetails={this.currentMeetingItem} cut={this.$utils.cut} />}
            </OverlayPanel>
            <ChangeTracker key={this.context.timerEntry?.key} enabled={!isLoading && this.context.needReload} onChange={this.refreshData} />
        </>
        );
    }
}

export default Calendar;

function snapTimeToGrid(grid, newValue) {
    newValue = moment(newValue);

    const mins = newValue.minutes();
    let diff = mins % grid;

    if (!diff) { return newValue.toDate(); }

    const movedUp = diff <= parseInt(grid / 2);
    if (movedUp) { diff = -diff; }
    else { diff = 15 - diff; }

    return newValue.add(diff, 'minutes').toDate();
}

function WorklogOptions({ worklog, onUpload, onClone }) {
    return (<div className="worklog-options">
        {!worklog.worklogId && <span className="fa fa-upload" title="Upload this worklog" event-icon="true" onClick={(e) => onUpload(worklog.id)} />}
        <span className="fa fa-clone" title="Clone worklog to same time" event-icon="true" onClick={(e) => onClone(worklog)} />
    </div>);
}