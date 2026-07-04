import moment from 'moment';

import BaseService from './base-service';
import type SettingsService from './settings-service';
import type StorageService from './storage-service';

interface TimerEntry {
    userId: number;
    key: string;
    description?: string;
    lapse: number;
    started?: number;
    created: number;
    autoPaused?: boolean;
}

interface TimeConfig {
    hour: number;
    minute: number;
    second: number;
    millisecond: number;
}

export default class WorklogTimerService extends BaseService {
    static dependencies = ['StorageService', 'SettingsService'];

    private $storage: StorageService;
    private $settings: SettingsService;

    constructor($storage: StorageService, $settings: SettingsService) {
        super();
        this.$storage = $storage;
        this.$settings = $settings;
    }

    async getCurrentTimer(): Promise<TimerEntry | undefined> {
        const entry = await this.$settings.get('WLTimer');
        return this.validateIFDayPast(entry);
    }

    async validateIFDayPast(entry: TimerEntry | undefined): Promise<TimerEntry | undefined> {
        if (!entry) {
            return;
        }
        const today = moment().startOf('day');
        const { created } = entry;
        const $created = moment(created);
        const isDayPast = $created.isBefore(today);
        if (!isDayPast) {
            return entry;
        }

        const { userId, key, description, started } = entry;
        const endOfDay = parseTime(await this.$settings.getGeneralSetting(userId, 'endOfDay'));

        const logEnd = moment($created).set(endOfDay);

        await this.stopTimerAndCreateWorklog(entry, logEnd.toDate().getTime());

        if (!started) {
            return;
        }

        const startOfDay = parseTime(await this.$settings.getGeneralSetting(userId, 'startOfDay'));
        let startTime = moment().set(startOfDay).toDate().getTime();
        const now = new Date().getTime();
        startTime = startTime > now ? now : startTime;
        const newEntry: TimerEntry = { userId, key, description, lapse: 0, started: startTime, created: startTime };
        await this.$settings.set('WLTimer', newEntry);

        return newEntry;
    }

    async startTimer(userId: number, key: string, description?: string, forceStop?: boolean): Promise<any> {
        const timer = await this.getCurrentTimer();

        if (timer && forceStop) {
            await this.stopTimer(timer.userId, timer.key);
        } else if (timer) {
            return { isActive: true, entry: timer };
        }

        const created = new Date().getTime();
        const newTimer: TimerEntry = { userId, key, created, started: created, lapse: 0, description };

        await this.$settings.set('WLTimer', newTimer);

        return newTimer;
    }

    async editTrackerInfo(ticketNo?: string, created?: Date, description?: string): Promise<TimerEntry | undefined> {
        ticketNo = ticketNo?.trim().toUpperCase();
        const timer = await this.getCurrentTimer();
        if (!timer) return;

        const startOfDay = moment().startOf('day');

        let createdTime: number | undefined;
        if (!created || !moment(created).isBetween(startOfDay, new Date(), undefined, '[]')) {
            createdTime = undefined;
        } else {
            createdTime = created.getTime();
        }

        timer.key = ticketNo || timer.key;
        timer.created = createdTime || timer.created;
        timer.description = description || timer.description;

        await this.$settings.set('WLTimer', timer);

        return timer;
    }

    async pauseTimer(auto?: boolean): Promise<TimerEntry | false> {
        const timer = await this.getCurrentTimer();
        if (!timer?.started) {
            return false;
        }
        const { started } = timer;
        const curTime = new Date().getTime();
        if (started >= curTime) {
            throw new Error('Time mismatch: System time has changed since timer has started');
        }
        const lapse = curTime - started;
        timer.lapse += lapse;
        delete timer.started;
        if (auto) {
            timer.autoPaused = true;
        }
        await this.$settings.set('WLTimer', timer);
        return timer;
    }

    async resumeTimer(auto?: boolean): Promise<TimerEntry | false> {
        const timer = await this.getCurrentTimer();
        if (!timer || timer.started || (auto && !timer.autoPaused)) {
            return false;
        }
        timer.started = new Date().getTime();
        delete timer.autoPaused;
        await this.$settings.set('WLTimer', timer);
        return timer;
    }

    async stopTimer(userId?: number, jiraIssue?: string): Promise<any> {
        const timer = await this.getCurrentTimer();
        if (!timer) {
            return false;
        }

        if (userId && jiraIssue && (timer.userId !== userId || timer.key !== jiraIssue)) {
            return { invalidEntry: true, entry: timer };
        }
        return this.stopTimerAndCreateWorklog(timer, new Date().getTime());
    }

    async stopTimerAndCreateWorklog(timer: TimerEntry, endTime: number): Promise<boolean> {
        const { started } = timer;
        if (started! > 0) {
            if (started! >= endTime) {
                if (started! >= new Date().getTime()) {
                    await this.$settings.set('WLTimer', null);
                    throw new Error('Time mismatch: System time has changed since timer has started');
                }
                endTime = moment(started).endOf('day').toDate().getTime();
            }
            const lapse = endTime - started!;
            timer.lapse += lapse;
            delete timer.started;
        }

        let timeInMins = parseInt(String(Math.round(timer.lapse / 60000)));

        const minTime = parseTimeInMins(await this.$settings.get('TR_MinTime'));
        if (timeInMins >= minTime) {
            const TR_RoundTime = (await this.$settings.get('TR_RoundTime')) || 5;
            const TR_RoundOpr = await this.$settings.get('TR_RoundOpr');

            if (TR_RoundOpr && (Math as any)[TR_RoundOpr]) {
                timeInMins = parseInt(String(Math.max(1, (Math as any)[TR_RoundOpr](timeInMins / TR_RoundTime)) * TR_RoundTime));
            }

            if (timeInMins >= 1) {
                const hour = Math.floor(timeInMins / 60);
                const mins = Math.floor(timeInMins % 60);
                const timeSpent = `${String(hour).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

                await this.$storage.addWorklog({
                    timeSpent,
                    ticketNo: timer.key,
                    isUploaded: false,
                    createdBy: timer.userId,
                    dateStarted: new Date(timer.created),
                    description: timer.description,
                });
            }
        }
        await this.$settings.set('WLTimer', null);

        return true;
    }
}

function parseTime(value: string | undefined): TimeConfig {
    if (!value) {
        return { hour: 0, minute: 0, second: 0, millisecond: 0 };
    }
    const arr = value.split(':');
    return { hour: parseInt(arr[0]), minute: parseInt(arr[1]), second: 0, millisecond: 0 };
}

function parseTimeInMins(value: string | undefined): number {
    const obj = parseTime(value);
    if (!obj) {
        return 0;
    }
    return obj.hour * 60 + obj.minute;
}
