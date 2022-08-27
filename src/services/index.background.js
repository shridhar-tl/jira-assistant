import AjaxRequestService from './ajax-request-service';
import DatabaseService from './database-service';
import MessageService from './message-service';
import SettingsService from './settings-service';
import StorageService from './storage-service';
import WorklogTimerService from './worklog-timer-service';
import { injectable, inject, injectProdBrowserServices, AnalyticsServiceFake } from './index.common';

export { inject };

// Any new classes injected should be added in index.d.ts file as well to support intellisense in VS Code.
export default function injectServices() {
    injectProdBrowserServices();
    injectable(AjaxRequestService, "AjaxRequestService", "$request", { isSingleton: true });
    injectable(AnalyticsServiceFake, "AnalyticsService", "$analytics", { isSingleton: true });
    injectable(DatabaseService, "DatabaseService", "$db", { isSingleton: true });
    injectable(MessageService, "MessageService", "$message", { isSingleton: true });
    injectable(SettingsService, "SettingsService", "$settings", { isSingleton: true });
    injectable(StorageService, "StorageService", "$storage", { isSingleton: true });
    injectable(WorklogTimerService, "WorklogTimerService", "$wltimer", { isSingleton: true });
}

export const serviceObjectMap = {
    AjaxRequestService: "$request",
    AppBrowserService: "$jaBrowserExtn",
    StorageService: "$storage",
    WorklogTimerService: "$wltimer",
    SettingsService: "$settings"
};