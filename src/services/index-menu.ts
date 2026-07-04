import DatabaseService from './database-service';
import { AnalyticsServiceFake, inject, injectable, injectProdBrowserServices } from './index-common';
import MessageService from './message-service';
import SettingsService from './settings-service';
import StorageService from './storage-service';

export { inject };

export default function injectServices(): void {
    injectProdBrowserServices();
    injectable(MessageService, 'MessageService', '$message', { isSingleton: true });
    injectable(SettingsService, 'SettingsService', '$settings', { isSingleton: true });
    injectable(StorageService, 'StorageService', '$storage', { isSingleton: true });
    injectable(DatabaseService, 'DatabaseService', '$db', { isSingleton: true });
    injectable(AnalyticsServiceFake, 'AnalyticsService', '$analytics', { isSingleton: true });
}
