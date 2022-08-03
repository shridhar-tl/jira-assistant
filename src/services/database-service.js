import Dexie from 'dexie';
import { UUID } from '../constants/utils';
import { SystemUserId } from '../constants/common';
import { EventCategory, SettingsCategory } from '../constants/settings';

class DatabaseService extends Dexie {
    static dependencies = ["AnalyticsService", "MessageService"];

    constructor($analytics, $message) {
        super("JiraAssist");
        this.$message = $message;
        this.$analytics = $analytics;

        this.initDatabase();

        if (typeof window !== 'undefined') {
            if (window.addEventListener) {
                window.addEventListener('unhandledrejection', (event) => this.handleError(event));
                window.addEventListener("rejectionhandled", (event) => this.handleError(event)); // For firefox
                window.addEventListener("error", (e) => {
                    const { error, filename, lineno, colno, message } = e || {};
                    const { stack } = error || {};
                    this.reportError(message, filename, lineno, colno, stack);
                    this.$message.error("An unknown error occured while processing your request", "Unhandled error", true);
                    console.error("Global handler:-", e);
                });
            } else {
                window.onerror = (msg, url, line, col, error) => {
                    const { stack } = error || {};
                    this.reportError(msg, url, line, col, stack);
                    this.$message.error("An unknown error occured while processing your request", "Unhandled error", true);
                    console.error(msg, url, line, col, error);
                };
            }
        }
    }

    initDatabase() {
        this.initialized = new Promise((resolve) => {
            this._setInitStatus = (sucess) => {
                resolve(sucess);
                delete this._setInitStatus;
            };

            this.version(2).stores({
                users: '++id,jiraUrl,userId',
                savedFilters: '++id,queryName,createdBy',
                appSettings: '[userId+category+name],[userId+category]',
                worklogs: '++id,createdBy,isUploaded,dateStarted,worklogId,ticketNo',
                events: '++id,createdBy,name,ticketNo,startTime,isEnabled,source,sourceId'
            });

            // Open the database
            this.open().catch((error) => {
                this.$analytics.trackError(error, true);
                console.error(error);
            });

            this.initUser();
        });
    }

    initUser() {
        // Database is being initialized for the first time
        return this.users.get(SystemUserId).then(async (user) => {
            if (!user) {
                const instId = UUID.generate();

                this.transaction('rw', this.users, this.appSettings, async () => {
                    await this.users.add({ id: SystemUserId, jiraUrl: 'SystemUser', userId: 'SystemUser', dateCreated: new Date(), instId });
                    await this.appSettings.add({
                        userId: SystemUserId,
                        category: SettingsCategory.System,
                        name: "instId",
                        value: instId
                    });

                    this._setInitStatus(true);

                    this.$analytics.setUserId(instId);
                    this.$analytics.trackEvent("New installation", EventCategory.Instance);
                }).catch((e) => {
                    this._setInitStatus(false);
                    this.reportError(e.message, "database-service.js", 32, 0, e.stack);
                    console.error("Unable to initialize the database:-", e);
                });
            }
            else {
                this._setInitStatus(true);

                const instId = await this.appSettings.get([SystemUserId, SettingsCategory.System, 'instId']);
                const anLog = await this.appSettings.get([SystemUserId, SettingsCategory.Advanced, 'enableAnalyticsLogging']);
                const exLog = await this.appSettings.get([SystemUserId, SettingsCategory.Advanced, 'enableExceptionLogging']);

                this.$analytics.setUserId(instId?.value || user.instId);
                this.$analytics.setIfEnabled(anLog?.value !== false, exLog?.value !== false);
            }
        });
    }

    reportError(msg, url, line, col, stack) {
        this.$analytics.trackError({ msg, url, line, col, stack }, true);
    }

    handleError(event) {
        const detail = event.detail || event;
        this.$analytics.trackError(detail, false);
        const reason = detail.reason || event.reason;
        const msgs = reason?.error?.errorMessages;
        let msg = 'One or more of the actions failed. Look at console for more details.';
        if (msgs && Array.isArray(msgs) && msgs.length > 0) {
            msg = msgs.join(',\n');
        }
        this.$message.error(msg, "Action error", true);
        console.error('Unhandled rejection (promise: ', detail.promise || event.promise, ', reason: ', reason, ').');
    }
}

export default DatabaseService;