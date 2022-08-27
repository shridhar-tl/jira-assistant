import DatabaseService from './database-service';
import MessageService from './message-service';
import SettingsService from './settings-service';
import StorageService from './storage-service';
import { injectable, inject, injectProdBrowserServices, AnalyticsServiceFake } from './index.common';

export { inject };

// Any new classes injected should be added in index.d.ts file as well to support intellisense in VS Code.
export default function injectServices() {
    injectProdBrowserServices();
    injectable(MessageService, "MessageService", "$message", { isSingleton: true });
    injectable(SettingsService, "SettingsService", "$settings", { isSingleton: true });
    injectable(StorageService, "StorageService", "$storage", { isSingleton: true });
    injectable(DatabaseService, "DatabaseService", "$db", { isSingleton: true });
    injectable(AnalyticsServiceFake, "AnalyticsService", "$analytics", { isSingleton: true });
}