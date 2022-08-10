import * as moment from 'moment';
import BaseService from "./base-service";

export default class WorklogTimerService extends BaseService {
    static dependencies = ["StorageService", "SettingsService"];

    constructor($storage, $settings) {
        super();
        this.$storage = $storage;
        this.$settings = $settings;
    }

    getCurrentTimer() { return this.$settings.get('WLTimer'); }

    async startTimer(userId, jiraIssue, description, forceStop) {
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

        // Check for existing timer
        const curTime = new Date().getTime();
        timer = { userId, key: jiraIssue, created: curTime, started: curTime, lapse: 0, description };

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

        const { started } = timer;
        if (started > 0) {
            const curTime = new Date().getTime();
            if (started >= curTime) {
                await this.$settings.set('WLTimer', null);
                throw new Error('Time mismatch: System time has changed since timer has started');
            }
            const lapse = curTime - started;
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