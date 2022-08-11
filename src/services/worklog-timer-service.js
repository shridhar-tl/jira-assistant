import * as moment from 'moment';
import BaseService from "./base-service";

export default class WorklogTimerService extends BaseService {
    static dependencies = ["StorageService", "SettingsService"];

    constructor($storage, $settings) {
        super();
        this.$storage = $storage;
        this.$settings = $settings;
    }

    async getCurrentTimer() {
        const entry = await this.$settings.get('WLTimer');
        return this.validateIFDayPast(entry);
    }

    async validateIFDayPast(entry) {
        if (!entry) { return; }
        const today = moment().startOf('day');
        const { created } = entry;
        const $created = moment(created);
        const isDayPast = $created.isBefore(today);
        if (!isDayPast) { return entry; }

        const { userId, key, description, started } = entry;
        //const maxHours = await this.$settings.getGeneralSetting(userId, 'maxHours');
        const endOfDay = parseTime(await this.$settings.getGeneralSetting(userId, 'endOfDay'));

        const logEnd = moment($created).set(endOfDay);

        await this.stopTimerAndCreateWorklog(entry, logEnd.toDate().getTime());

        // If last day's timer is not running, then do not start new timer
        if (!started) { return; }

        const startOfDay = parseTime(await this.$settings.getGeneralSetting(userId, 'startOfDay'));
        let startTime = moment().set(startOfDay).toDate().getTime();
        const now = new Date().getTime();
        startTime = (startTime > now) ? now : startTime;
        const newEntry = { userId, key, description, lapse: 0, started: startTime, created: startTime };
        await this.$settings.set('WLTimer', newEntry);

        return newEntry;
    }

    async startTimer(userId, key, description, forceStop) {
        /* Ticket validation not really required
        const ticket = this.$ticket.getTicketDetails(jiraIssue);
        if (!ticket) {
            throw new Error('Invalid ticket number provided');
        }*/
        let timer = await this.getCurrentTimer();

        if (timer && forceStop) {
            await this.stopTimer(timer.userId, timer.key);
        } else if (timer) {
            return { isActive: true, entry: timer };
        }

        const created = new Date().getTime();
        timer = { userId, key, created, started: created, lapse: 0, description };

        await this.$settings.set('WLTimer', timer);

        return timer;
    }

    async editTrackerInfo(ticketNo, created, description) {
        ticketNo = ticketNo?.trim().toUpperCase();
        const timer = await this.getCurrentTimer();
        const startOfDay = moment().startOf('day');

        if (!created || moment(created).isBetween(startOfDay, new Date())) {
            created = undefined;
        } else {
            created = created.getTime();
        }

        timer.key = ticketNo || timer.key;
        timer.created = created || timer.created;
        timer.description = description || timer.description;

        await this.$settings.set('WLTimer', timer);

        return timer;
    }

    async pauseTimer() {
        const timer = await this.getCurrentTimer();
        if (!timer?.started) { return false; }
        const { started } = timer;
        const curTime = new Date().getTime();
        if (started >= curTime) {
            throw new Error('Time mismatch: System time has changed since timer has started');
        }
        const lapse = curTime - started;
        timer.lapse += lapse;
        delete timer.started;

        await this.$settings.set('WLTimer', timer);
        return timer;
    }

    async resumeTimer() {
        const timer = await this.getCurrentTimer();
        if (!timer || timer.started) { return false; }
        timer.started = new Date().getTime();

        await this.$settings.set('WLTimer', timer);
        return timer;
    }

    async stopTimer(userId, jiraIssue) {
        const timer = await this.getCurrentTimer();
        if (!timer) { return false; }

        if (userId && jiraIssue && (timer.userId !== userId || timer.key !== jiraIssue)) {
            return { invalidEntry: true, entry: timer };
        }
        return this.stopTimerAndCreateWorklog(timer, new Date().getTime());
    }

    async stopTimerAndCreateWorklog(timer, endTime) {
        const { started } = timer;
        if (started > 0) {
            if (started >= endTime) {
                if (started >= new Date().getTime()) {
                    await this.$settings.set('WLTimer', null);
                    throw new Error('Time mismatch: System time has changed since timer has started');
                }
                endTime = moment(started).endOf('day').toDate().getTime();
            }
            const lapse = endTime - started;
            timer.lapse += lapse;
            delete timer.started;
        }

        const timeInMins = parseInt(Math.round(timer.lapse / 60000));

        const hour = Math.floor(timeInMins / 60);
        const mins = Math.floor(timeInMins % 60);
        const timeSpent = `${hour.pad(2)}:${mins.pad(2)}`;

        await this.$storage.addWorklog({
            timeSpent,
            ticketNo: timer.key,
            isUploaded: false,
            createdBy: timer.userId,
            dateStarted: new Date(timer.created),
            description: timer.description
        });
        await this.$settings.set('WLTimer', null);

        return true;
    }
}

function parseTime(value) {
    if (!value) { return; }
    const arr = value.split(':');
    return { hour: parseInt(arr[0]), minute: parseInt(arr[1]), second: 0, millisecond: 0 };
}