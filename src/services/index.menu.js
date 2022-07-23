import DatabaseService from './database-service';
import MessageService from './message-service';
import SettingsService from './settings-service';
import StorageService from './storage-service';
import { injectable, inject, injectProdBrowserServices, AnalyticsServiceFake } from './index.common';

export { inject };

// Any new classes injected should be added in index.d.ts file as well to support intellisense in VS Code.
export default function injectServices() {
    injectProdBrowserServices();
    injectable(MessageService, "MessageService", "$message");
    injectable(SettingsService, "SettingsService", "$settings");
    injectable(StorageService, "StorageService", "$storage");
    injectable(DatabaseService, "DatabaseService", "$db");
    injectable(AnalyticsServiceFake, "AnalyticsService", "$analytics", { isSingleton: false });
}