import { messagesUrl } from "../_constants";
import { BROWSER_NAME } from "../common/browsers";
import * as moment from 'moment';

export default class NotificationService {
    static dependencies = ["AjaxService", "CacheService", "AppBrowserService", "UtilsService", "MessageService"];

    constructor($ajax, $cache, $browser, $userutils) {
        this.$ajax = $ajax;
        this.$cache = $cache;
        this.$userutils = $userutils;
        this.$browser = $browser;

        $browser.getAppVersion().then(v => this.version = parseFloat(v));
    }

    async getNotifications() {
        const { updates_info, notifications } = await this.fetchNotifications();

        if (!notifications) {
            return { count: 0, list: [] };
        }

        let processedNotifications = this.$cache.get("processed_notifications") || [];

        processedNotifications = processedNotifications.filter(id => !!notifications[id]);
        this.$cache.set("processed_notifications", processedNotifications.length ? processedNotifications : null);

        processedNotifications.forEach(id => {
            notifications[id].read = true;
        });

        const allNotifications = Object.keys(notifications).map(id => {
            const noti = notifications[id];
            const { version, browsers } = noti;

            if (browsers && browsers.length && !browsers.contains(BROWSER_NAME)) {
                return false;
            }

            if (version) {
                let comparer = "=";
                let ver = 0;

                if (isNaN(version)) {
                    comparer = version[0];
                    ver = parseFloat(version.substring(1));
                }
                else {
                    ver = parseFloat(version);
                }

                if (
                    (comparer === "=" && ver !== this.version)
                    ||
                    (comparer === ">" && ver >= this.version)
                    ||
                    (comparer === "<" && ver <= this.version)
                ) {
                    return false;
                }
            }

            const { type, title, message, autohide, module, read, important } = noti;

            return { id, type, title, message, autohide, module, read, important };
        }).filter(Boolean);
        //if (count < allNotifications.length) {
        //    allNotifications = allNotifications.orderBy(n => (n.read ? 2 : 1));
        //}

        const updateNoti = this.getVersionNotification(updates_info);
        if (updateNoti) {
            allNotifications.splice(0, 0, updateNoti);
        }

        const version = await this.getExtnAvailableUpdates();
        let isBeta = true;
        if (version && this.version < version) {
            const versionInfo = updates_info.filter(u => u.version === version)[0];
            if (versionInfo) {
                versionInfo.availableNow = true;
                isBeta = versionInfo.isBeta !== false;
            } else {
                const date = new Date();
                updates_info.splice(0, 0, {
                    availableNow: true,
                    version,
                    isBeta,
                    date,
                    bugs: [],
                    whatsnew: ["Information not available yet"]
                });
            }
        }

        return {
            updates_info,
            updatesAvailable: { version, isBeta },
            list: allNotifications, total: allNotifications.length,
            unread: allNotifications.count(n => !n.read)
        };
    }

    getVersionNotification(updates_info) {
        if (updates_info && Array.isArray(updates_info) && updates_info.length) {
            const lastReadVersion = this.$cache.get("readVersion") || { version: 0, timestamp: 0 };

            const { version, timestamp, whatsnew, publishDate, expectedOn } = updates_info[0];

            if (lastReadVersion.version < version || lastReadVersion.timestamp < timestamp) {
                let message = `You have ${whatsnew.length} new updates added in this version. Click to know what is new...`;
                let title = `Whats new in Jira Assistant v${version}`;

                if (version > this.version) {
                    let publishMessage = "is available now to update";

                    if (!publishDate) {
                        const exptDate = expectedOn ? `on ${this.$userutils.formatDate(expectedOn, "dd-MMM-yyyy")} approximately` : "soon";
                        publishMessage = `will be published ${exptDate}`;
                    }

                    message = `You have ${whatsnew.length} new updates added in this version and ${publishMessage}. Click to know what is new...`;
                    title = `Upcomming in Jira Assistant v${version}`;
                }

                return { id: `v${version}`, type: "versionInfo", version, timestamp, title, message };
            }
        }
    }

    markRead(msg) {
        if (!msg) { return; }
        if (msg.type === "versionInfo") {
            const { version, timestamp } = msg;
            this.$cache.set("readVersion", { version, timestamp });
        }
        else {
            const readMessages = this.$cache.get("processed_notifications") || [];
            readMessages.push(msg.id);
            this.$cache.set("processed_notifications", readMessages);
        }
    }

    async getUnreadCount() {
        const notis = await this.getNotifications();
        return notis.unread;
    }

    async fetchNotifications() {
        let data = this.$cache.get("messages");

        if (!data) {
            data = await this.$ajax.execute("GET", messagesUrl, null, { withCredentials: false });

            if (data) {
                this.$cache.set("messages", data, moment().add(4, 'hours'));
            }

            return data;
        }

        return new Promise((success) => {
            setTimeout(() => {
                success(data);
            }, 500);
        });
    }

    async getExtnAvailableUpdates() {
        let data = this.$cache.get("available_updates");

        if (!data) {
            data = { version: await this.$browser.hasUpdates() };

            this.$cache.set("available_updates", data, moment().add(4, 'hours'));
        }

        return data.version;
    }
}
