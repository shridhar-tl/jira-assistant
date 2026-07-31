import {
    SystemUserId,
    dateFormats,
    timeFormats,
    DefaultWorkingDays,
    DefaultStartOfDay,
    DefaultEndOfDay,
    DefaultMinHours,
    DefaultMaxHours,
} from '@/constants';

import { SettingsCategory } from '@types';

import type StorageService from './storage-service';

const settingsDefaultValues: Record<string, any> = {
    workingDays: DefaultWorkingDays,
    holidays: [],
    dateFormat: dateFormats[0],
    timeFormat: timeFormats[0],
    minHours: DefaultMinHours,
    maxHours: DefaultMaxHours,
    commentLength: 5,
    startOfDay: DefaultStartOfDay,
    endOfDay: DefaultEndOfDay,
};

export default class SettingsService {
    static dependencies = ['StorageService'];

    private $storage: StorageService;

    constructor($storage: StorageService) {
        this.$storage = $storage;
    }

    getAllSettings = async (userId: number, category: string): Promise<Record<string, any>> => {
        const settings = await this.$storage.filterSettings({ userId, category });

        return settings.reduce(
            (obj, cur) => {
                obj[cur.name] = cur.value;
                return obj;
            },
            {} as Record<string, any>,
        );
    };

    getSetting = async (userId: number, category: SettingsCategory, name: string): Promise<any> => {
        const sett = await this.$storage.getSetting(userId, category, name);
        return sett?.value;
    };

    getGeneralSettings = async (userId: number): Promise<Record<string, any>> => {
        const userSettings = await this.getAllSettings(userId, SettingsCategory.General);
        const globalSettings = await this.getAllSettings(SystemUserId, SettingsCategory.General);

        const result = { ...globalSettings, ...userSettings };

        result.hasGoogleCredentials = !!result.dataStore;
        result.hasOutlookCredentials = !!result.OLBT;

        return result;
    };

    getAdvancedSettings = async (userId: number): Promise<Record<string, any>> => {
        const userSettings = await this.getAllSettings(userId, SettingsCategory.Advanced);
        let globalSettings: Record<string, any> = {};

        if (userId !== SystemUserId) {
            globalSettings = await this.getAllSettings(SystemUserId, SettingsCategory.Advanced);
        }

        const result = { ...globalSettings, ...userSettings };

        return result;
    };

    getGeneralSetting = async (userId: number, name: string): Promise<any> => {
        let value = await this.getSetting(userId, SettingsCategory.General, name);

        if (value === undefined) {
            value = await this.getSetting(SystemUserId, SettingsCategory.General, name);
        }

        return value !== undefined ? value : settingsDefaultValues[name];
    };

    getPageSettings = (userId: number, name?: string): Promise<Record<string, any>> =>
        this.getAllSettings(userId, SettingsCategory.PageSettings);

    getDashboards = async (userId: number): Promise<any[]> => {
        const settings = await this.$storage.filterSettings({
            userId,
            category: SettingsCategory.Dashboard,
        });

        let boards: any[];
        if (settings.length) {
            boards = settings.map(({ value }) => value).filter(Boolean);
        } else {
            boards = [
                {
                    isQuickView: true,
                    layout: 1,
                    name: 'Default',
                    icon: 'fa fa-tachometer',
                    widgets: [{ name: 'myOpenTickets' }, { name: 'myBookmarks' }, { name: 'dateWiseWorklog' }, { name: 'pendingWorklog' }],
                },
            ];
        }

        return boards;
    };

    deleteDashboard = (userId: number, id: string | number): Promise<void> =>
        this.$storage.deleteSetting(userId, SettingsCategory.Dashboard, id as string);

    saveSetting = async (userId: number, category: SettingsCategory, name: string, value: any): Promise<void> => {
        if (value === undefined || value === null) {
            return await this.$storage.deleteSetting(userId, category, name);
        } else {
            return await this.$storage.addOrUpdateSetting({ userId, category, name, value });
        }
    };

    saveGeneralSetting = (userId: number, name: string, value: any): Promise<void> =>
        this.saveSetting(userId, SettingsCategory.General, name, value);

    savePageSetting = (userId: number, name: string, value: any): Promise<void> =>
        this.saveSetting(userId, SettingsCategory.PageSettings, name, value);

    set = (name: string, value: any): Promise<void> => this.saveSetting(SystemUserId, SettingsCategory.System, name, value);

    get = (name: string): Promise<any> => this.getSetting(SystemUserId, SettingsCategory.System, name);
}
