import moment from 'moment';

import { BROWSER_NAME } from '@/common/browsers';
import { AppVersionNo, isWebBuild, messagesUrl } from '@/constants';

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
    version?: any;
    timestamp?: number;
    browsers?: string[];
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
        const { updates_info, live_versions, notifications } = await this.fetchNotifications();

        if (!notifications) {
            return { count: 0, list: [] };
        }

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
                    let ver = 0;

                    if (isNaN(version)) {
                        comparer = version[0];
                        ver = parseFloat(version.substring(1));
                    } else {
                        ver = parseFloat(version);
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
            const version = live_versions?.[BROWSER_NAME];
            let isBeta = true;
            if (version && this.version < version) {
                const versionInfo = updates_info.filter((u: any) => u.version === version)[0];
                if (versionInfo) {
                    versionInfo.availableNow = true;
                    isBeta = versionInfo.isBeta !== false;
                } else {
                    const date = new Date().getTime();
                    updates_info.splice(0, 0, {
                        availableNow: true,
                        version,
                        isBeta,
                        date,
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

    async getVersionNotification(updates_info: any[]): Promise<Notification | undefined> {
        if (updates_info && Array.isArray(updates_info) && updates_info.length) {
            const lastReadVersion = (await this.$settings.get('readVersion')) || { version: 0, timestamp: 0 };

            const { version, timestamp, whatsnew, publishDate, expectedOn } = updates_info[0];

            if (lastReadVersion.version < version || (lastReadVersion.timestamp || 0) < (timestamp || 0)) {
                let message = `You have ${whatsnew.length} new updates added in this version. Click to know what is new...`;
                let title = `Whats new in Jira Assistant v${version}`;

                if (version > this.version) {
                    let publishMessage = 'is available now to update';
                    const now = new Date().getTime();

                    if (!publishDate || (publishDate as number) < now) {
                        const exptDate =
                            expectedOn && (expectedOn as number) > now
                                ? `on ${this.$userutils.formatDate(new Date(expectedOn as number), 'dd-MMM-yyyy')} approximately`
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

    async fetchNotifications(): Promise<any> {
        let data = this.$cache.get('messages');

        if (!data) {
            data = await this.$request.execute('GET', messagesUrl, null, { withCredentials: false });

            if (data) {
                this.$cache.set('messages', data, moment().add(4, 'hours').toDate());
            }

            return data;
        }

        return new Promise((success) => {
            setTimeout(() => {
                success(data);
            }, 500);
        });
    }
}
