import AjaxRequestService from './ajax-request-service';
import MessageService from './message-service';
import StorageService from './storage-service';
import DatabaseService from './database-service';
import { injectable, inject, injectProdBrowserServices, AnalyticsServiceFake } from './index.common';

export { inject };

// Any new classes injected should be added in index.d.ts file as well to support intellisense in VS Code.
export default function injectServices() {
    injectProdBrowserServices();
    injectable(AjaxRequestService, "AjaxRequestService", "$request");
    injectable(MessageService, "MessageService", "$message");
    injectable(StorageService, "StorageService", "$storage");
    injectable(DatabaseService, "DatabaseService", "$db");
    injectable(AnalyticsServiceFake, "AnalyticsService", "$analytics", { isSingleton: false });
}

export const serviceObjectMap = {
    AjaxRequestService: "$request",
    AppBrowserService: "$jaBrowserExtn",
    StorageService: "$storage"
};