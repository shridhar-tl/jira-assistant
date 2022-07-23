import Dexie from 'dexie';
import { UUID, EventCategory, SystemUserId } from '../_constants';

class DatabaseService extends Dexie {
    static dependencies = ["AnalyticsService", "MessageService"];

    constructor($analytics, $message) {
        super("JiraAssist");
        this.$message = $message;
        this.$analytics = $analytics;

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

        // Database is being initialized for the first time
        this.users.get(SystemUserId).then((user) => {
            if (!user) {
                const instId = UUID.generate();

                this.transaction('rw', this.users, () => {
                    this.users.add({ jiraUrl: 'SystemUser', userId: 'SystemUser', dateCreated: new Date(), instId }).then(() => {
                        this.$analytics.setUserId(instId);
                        this.$analytics.trackEvent("New installation", EventCategory.Instance);
                    });
                }).catch((e) => {
                    this.reportError(e.message, "database-service.js", 32, 0, e.stack);
                    console.error("Unable to initialize the database:-", e);
                });
            }
            else {
                let instId = user.instId;

                // ToDo: Temp. Temp fix for existing users. Need to be removed once all user will have this.
                if (!instId) {
                    instId = UUID.generate();
                    user.instId = instId;
                    this.users.put(user).then(() => { this.$analytics.trackEvent("User Inst ID added", EventCategory.Temporary); });
                }
                // ToDo ends

                this.$analytics.setUserId(instId);

                this.$analytics.setIfEnabled(user.enableAnalyticsLogging !== false, user.enableExceptionLogging !== false);
            }
        });

        if (typeof window !== 'undefined') {
            window.addEventListener('unhandledrejection', (event) => this.handleError(event));
            window.addEventListener("rejectionhandled", (event) => this.handleError(event)); // For firefox

            if (window.addEventListener) {
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

    reportError(msg, url, line, col, stack) {
        this.$analytics.trackError({ msg, url, line, col, stack }, true);
    }

    handleError(event) {
        const detail = event.detail || event;
        this.$analytics.trackError(detail, false);
        this.$message.error("One or more of the actions failed", "Action error", true);
        console.error('Unhandled rejection (promise: ', detail.promise || event.promise, ', reason: ', detail.reason || event.reason, ').');
    }
}

export default DatabaseService;