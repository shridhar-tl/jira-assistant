import Dexie, { type Table } from 'dexie';

import { EventCategory } from '@/constants';

import { UUID } from '@utils/uuid';

import type { AppSetting, Event, SavedFilter, User, Worklog } from '@types';
import { SettingsCategory } from '@types';

import { SystemUserId } from '../constants/common';

import type AnalyticsService from './analytics-service';
import type MessageService from './message-service';

class DatabaseService extends Dexie {
    users!: Table<User, number>;
    savedFilters!: Table<SavedFilter, number>;
    appSettings!: Table<AppSetting>;
    worklogs!: Table<Worklog, number>;
    events!: Table<Event, number>;

    private $analytics: AnalyticsService;
    private $message: MessageService;
    private _initialized = false;

    constructor($analytics: any, $message: any) {
        super('JiraAssist');

        this.$analytics = $analytics;
        this.$message = $message;

        if (typeof window !== 'undefined') {
            if (window.addEventListener) {
                window.addEventListener('unhandledrejection', (event) => this.handleError(event));
                window.addEventListener('rejectionhandled', (event) => this.handleError(event));
                window.addEventListener('error', (e: any) => {
                    const { error, filename, lineno, colno, message } = e || {};
                    const { stack } = error || {};
                    this.reportError(message, filename, lineno, colno, stack);
                    this.$message.error('An unknown error occurred while processing your request', 'Unhandled error', true);
                    console.error('Global handler:-', e);
                });
            } else {
                (window as any).onerror = (msg: string, url: string, line: number, col: number, error: Error) => {
                    const { stack } = error || {};
                    this.reportError(msg, url, line, col, stack);
                    this.$message.error('An unknown error occurred while processing your request', 'Unhandled error', true);
                    console.error(msg, url, line, col, error);
                };
            }
        }

        this.initDatabase();
    }

    private initDatabase(): void {
        this.on('populate', this.populateSystemSettings.bind(this));
        this.on('ready', this.loadSettings.bind(this));

        this.version(2).stores({
            users: '++id,jiraUrl,userId',
            savedFilters: '++id,queryName,createdBy',
            appSettings: '[userId+category+name],[userId+category]',
            worklogs: '++id,createdBy,isUploaded,dateStarted,worklogId,ticketNo',
            events: '++id,createdBy,name,ticketNo,startTime,isEnabled,source,sourceId',
        });

        this.open().catch((error) => {
            this.$analytics?.trackError(error, true);
            console.error(error);
        });
    }

    private async loadSettings(): Promise<void> {
        if (this._initialized) {
            return;
        }

        console.log('Loading system settings');
        try {
            const setInstId = await this.appSettings.get([SystemUserId, SettingsCategory.System, 'instId']);
            const anLog = await this.appSettings.get([SystemUserId, SettingsCategory.Advanced, 'enableAnalyticsLogging']);
            const exLog = await this.appSettings.get([SystemUserId, SettingsCategory.Advanced, 'enableExceptionLogging']);

            let instId = setInstId?.value;
            if (!instId) {
                instId = (await this.users.get(SystemUserId))?.instId;
            }

            this.$analytics?.setUserId(instId);
            this.$analytics?.setIfEnabled(anLog?.value !== false, exLog?.value !== false);
            this._initialized = true;
            console.log('Completed loading system settings');
        } catch (e) {
            console.error('Error loading settings:', e);
        }
    }

    private async populateSystemSettings(tr: any): Promise<void> {
        console.log('Populating system settings');
        try {
            const instId = UUID.generate();
            const now = new Date();

            await tr.users.add({
                id: SystemUserId,
                jiraUrl: 'SystemUser',
                userId: 'SystemUser',
                dateCreated: now,
                instId,
            } as User);

            await tr.appSettings.add({
                userId: SystemUserId,
                category: SettingsCategory.System,
                name: 'instId',
                value: instId,
            } as AppSetting);

            this.$analytics?.setUserId(instId);
            this.$analytics?.trackEvent('New installation', EventCategory.Instance);
            console.log('Completed populating system settings');
        } catch (e: any) {
            this.reportError(e.message, 'database-service.ts', 0, 0, e.stack);
            console.error('Unable to initialize the database:-', e);
        }
    }

    private handleError(event: any): void {
        const detail = event.detail || event;
        this.$analytics.trackError(detail, false);
        const reason = detail.reason || event.reason;
        const msgs = reason?.error?.errorMessages;
        let msg = 'One or more of the actions failed. Look at console for more details.';
        if (msgs && Array.isArray(msgs) && msgs.length > 0) {
            msg = msgs.join(',\n');
        }
        this.$message.error(msg, 'Action error', true);
        console.error('Unhandled rejection (promise: ', detail.promise || event.promise, ', reason: ', reason, ').');
    }

    private reportError(msg: string, url?: string, line?: number, col?: number, stack?: string): void {
        if (this.$analytics) {
            this.$analytics.trackError({
                msg,
                url,
                line,
                col,
                stack,
            });
        }
    }
}

(DatabaseService as any).dependencies = ['AnalyticsService', 'MessageService'];

export default DatabaseService;
