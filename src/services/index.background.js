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
    injectable(AjaxRequestService, "AjaxRequestService", "$request");
    injectable(AnalyticsServiceFake, "AnalyticsService", "$analytics", { isSingleton: false });
    injectable(DatabaseService, "DatabaseService", "$db");
    injectable(MessageService, "MessageService", "$message");
    injectable(SettingsService, "SettingsService", "$settings");
    injectable(StorageService, "StorageService", "$storage");
    injectable(WorklogTimerService, "WorklogTimerService", "$wltimer");
}

export const serviceObjectMap = {
    AjaxRequestService: "$request",
    AppBrowserService: "$jaBrowserExtn",
    StorageService: "$storage",
    WorklogTimerService: "$wltimer",
    SettingsService: "$settings"
};