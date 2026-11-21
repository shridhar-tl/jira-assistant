import moment from 'moment';

import { AppVersionNo, isPluginBuild, isWebBuild, messagesUrl } from '@/constants';
import { BROWSER_NAME } from '@/utils/browsers';

import type AjaxRequestService from './ajax-request-service';
import type CacheService from './cache-service';
import type SettingsService from './settings-service';
import type UserUtilsService from './userutils-service';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    autoHide?: boolean;
    module?: string;
    read?: boolean;
    important?: boolean;
    version?: string | number;
    timestamp?: number;
    browsers?: string[];
}

export type MessageDate = string | number | null;

export interface UpdateDescription {
    id?: number;
    text: string;
}

interface UpdateInfoBase<TDate> {
    version: string | number;
    title?: string;
    isBeta?: boolean;
    availableNow?: boolean;
    date?: TDate;
    publishDate?: TDate;
    expectedOn?: TDate;
    timestamp?: TDate;
    whatsnew: Array<string | UpdateDescription>;
    bugs?: Array<string | UpdateDescription>;
}

export type UpdateInfo = UpdateInfoBase<number | undefined>;

interface MessagesPayloadBase<TDate> {
    timestamp?: TDate;
    live_versions?: Record<string, number>;
    updates_info?: Array<UpdateInfoBase<TDate>>;
    notifications?: Record<string, Notification>;
}

type RawMessagesPayload = MessagesPayloadBase<MessageDate | undefined>;
type MessagesPayload = MessagesPayloadBase<number | undefined>;

function toEpoch(value: MessageDate | undefined): number | undefined {
    if (value === null || value === undefined || value === '') {
        return undefined;
    }

    const time = new Date(value).getTime();
    return isNaN(time) ? undefined : time;
}

const liveVersionKey = isPluginBuild ? 'cloudApp' : BROWSER_NAME;

// Versions are published either as numbers (3.01) or as dotted strings ("3.0.1").
// Dotted versions map to the numeric form by collapsing everything after the major part: "3.0.1" => 3.01
export function versionToNumber(version: string | number | undefined | null): number {
    if (typeof version === 'number') {
        return version;
    }

    if (!version) {
        return 0;
    }

    const [major, ...rest] = version.trim().split('.');
    const value = parseFloat(rest.length ? `${major}.${rest.join('')}` : major);
    return isNaN(value) ? 0 : value;
}

function normalizeMessages(data: RawMessagesPayload): MessagesPayload {
    return {
        ...data,
        timestamp: toEpoch(data.timestamp),
        updates_info: data.updates_info?.map((u) => ({
            ...u,
            date: toEpoch(u.date),
            publishDate: toEpoch(u.publishDate),
            expectedOn: toEpoch(u.expectedOn),
            timestamp: toEpoch(u.timestamp),
        })),
    };
}

export default class NotificationService {
    static dependencies = ['AjaxRequestService', 'CacheService', 'SettingsService', 'UserUtilsService'];

    private $request: AjaxRequestService;
    private $cache: CacheService;
    private $settings: SettingsService;
    private $userutils: UserUtilsService;
    private version: number;

    constructor($request: AjaxRequestService, $cache: CacheService, $settings: SettingsService, $userutils: UserUtilsService) {
        this.$request = $request;
        this.$cache = $cache;
        this.$settings = $settings;
        this.$userutils = $userutils;
        this.version = AppVersionNo;
    }

    async getNotifications(): Promise<any> {
        const { updates_info = [], live_versions, notifications = {} } = await this.fetchNotifications();

        let processedNotifications = this.$cache.get('processed_notifications') || [];

        processedNotifications = processedNotifications.filter((id: string) => !!notifications[id]);
        this.$cache.set('processed_notifications', processedNotifications.length ? processedNotifications : null);

        processedNotifications.forEach((id: string) => {
            notifications[id].read = true;
        });

        const allNotifications = Object.keys(notifications)
            .map((id) => {
                const noti = notifications[id];
                const { version, browsers } = noti;

                if (browsers && browsers.length && !browsers.includes(BROWSER_NAME)) {
                    return false;
                }

                if (version) {
                    let comparer = '=';
                    let ver: number;

                    if (typeof version === 'string' && ['=', '>', '<'].includes(version[0])) {
                        comparer = version[0];
                        ver = versionToNumber(version.substring(1));
                    } else {
                        ver = versionToNumber(version);
                    }

                    if (
                        (comparer === '=' && ver !== this.version) ||
                        (comparer === '>' && ver >= this.version) ||
                        (comparer === '<' && ver <= this.version)
                    ) {
                        return false;
                    }
                }

                const { type, title, message, autoHide, module, read, important } = noti;

                return { id, type, title, message, autoHide, module, read, important };
            })
            .filter(Boolean);

        const updateNoti = await this.getVersionNotification(updates_info);
        if (updateNoti) {
            allNotifications.splice(0, 0, updateNoti as any);
        }

        let updatesAvailable;
        if (!isWebBuild) {
            const liveVersion = versionToNumber(live_versions?.[liveVersionKey]);
            if (liveVersion && this.version < liveVersion) {
                let version: string | number = liveVersion;
                let isBeta = true;
                const versionInfo = updates_info.find((u) => versionToNumber(u.version) === liveVersion);
                if (versionInfo) {
                    versionInfo.availableNow = true;
                    isBeta = versionInfo.isBeta !== false;
                    version = versionInfo.version;
                } else {
                    updates_info.splice(0, 0, {
                        availableNow: true,
                        version,
                        isBeta,
                        date: Date.now(),
                        bugs: [],
                        whatsnew: ['Information not available yet'],
                    });
                }
                updatesAvailable = { version, isBeta };
            }
        }

        return {
            updates_info,
            updatesAvailable,
            list: allNotifications,
            total: allNotifications.length,
            unread: allNotifications.filter((n: any) => !n.read).length,
        };
    }

    async getVersionNotification(updates_info: UpdateInfo[]): Promise<Notification | undefined> {
        if (updates_info && Array.isArray(updates_info) && updates_info.length) {
            const lastReadVersion = (await this.$settings.get('readVersion')) || { version: 0, timestamp: 0 };

            const { version, timestamp, whatsnew, publishDate, expectedOn } = updates_info[0];

            const versionNo = versionToNumber(version);

            if (versionToNumber(lastReadVersion.version) < versionNo || (lastReadVersion.timestamp || 0) < (timestamp || 0)) {
                let message = `You have ${whatsnew.length} new updates added in this version. Click to know what is new...`;
                let title = `Whats new in Jira Assistant v${version}`;

                if (versionNo > this.version) {
                    let publishMessage = 'is available now to update';
                    const now = Date.now();

                    if (!publishDate || publishDate > now) {
                        const exptDate =
                            expectedOn && expectedOn > now
                                ? `on ${this.$userutils.formatDate(new Date(expectedOn), 'dd-MMM-yyyy')} approximately`
                                : 'soon';
                        publishMessage = `will be published ${exptDate}`;
                    }

                    message = `You have ${whatsnew.length} new updates added in this version and ${publishMessage}. Click to know what is new...`;
                    title = `Upcoming in Jira Assistant v${version}`;
                }

                return { id: `v${version}`, type: 'versionInfo', version, timestamp, title, message };
            }
        }
    }

    markRead(msg: Notification): void {
        if (!msg) {
            return;
        }
        if (msg.type === 'versionInfo') {
            const { version, timestamp } = msg;
            this.$settings.set('readVersion', { version, timestamp });
        } else {
            const readMessages = this.$cache.get('processed_notifications') || [];
            readMessages.push(msg.id);
            this.$cache.set('processed_notifications', readMessages);
        }
    }

    async getUnreadCount(): Promise<number> {
        const notis = await this.getNotifications();
        return notis.unread;
    }

    async fetchNotifications(): Promise<MessagesPayload> {
        const data: RawMessagesPayload | null = this.$cache.get('messages');

        if (!data) {
            const response: RawMessagesPayload | null = await this.$request.execute('GET', messagesUrl, null, { withCredentials: false });

            if (response) {
                this.$cache.set('messages', response, moment().add(4, 'hours').toDate());
            }

            return normalizeMessages(response || {});
        }

        return new Promise((success) => {
            setTimeout(() => {
                success(normalizeMessages(data));
            }, 500);
        });
    }
}
