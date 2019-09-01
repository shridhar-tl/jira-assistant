import { ApiUrls, dateFormats, timeFormats } from '../_constants';

export default class ConfigService {
    static dependencies = ["SessionService", "AuthService", "DatabaseService", "AjaxService", "UtilsService", "AppBrowserService", "MessageService"];

    constructor($session, $auth, $db, $jaHttp, $utils, $jaBrowserExtn, $message) {
        this.$session = $session;
        this.$auth = $auth;
        this.$db = $db;
        this.$jaHttp = $jaHttp;
        this.$utils = $utils;
        this.$jaBrowserExtn = $jaBrowserExtn;
        this.$message = $message;
    }

    // ToDo
    //toggleEvent(eventId, enabled) {
    //  return this.$db.events.where("id").equals(eventId).first().then((e) => { e.isEnabled = enabled; return this.$db.events.put(e); });
    //}
    //getEvents() { return this.$db.events.where("createdBy").equals(this.$session.userId).toArray(); }

    saveSettings(pageName, newSettings) {
        return this.$auth.getCurrentUser().then((usr) => {
            if (!usr.settings) {
                usr.settings = {};
            }

            if (newSettings === undefined) {
                newSettings = this.$session.pageSettings[pageName];
            }

            usr.settings[`page_${pageName}`] = newSettings;
            return this.$db.users.put(usr).then(r => r);
        });
    }

    updateAuthCode(authCode) {
        return this.$db.users.get(this.$session.userId).then((u) => {
            u.dataStore = authCode;
            return this.$db.users.put(u).then(() => { return true; });
        });
    }

    getUserSettings() {
        return this.$auth.getCurrentUser().then((user) => {
            const settings = {
                teamMembers: user.team || [],
                autoUpload: user.autoUpload,
                dateFormat: user.dateFormat,
                maxHours: user.maxHours,
                workingDays: user.workingDays || [1, 2, 3, 4, 5],
                taskLogEnabled: user.taskLogEnabled,
                timeFormat: user.timeFormat,
                uploadLogBy: user.uploadLogBy,
                meetingTicket: user.meetingTicket,
                googleIntegration: user.googleIntegration,
                autoLaunch: user.autoLaunch,
                notifyBefore: user.notifyBefore,
                allowClosedTickets: user.allowClosedTickets,
                checkUpdates: user.checkUpdates,
                hasGoogleCredentials: !!user.dataStore,
                pruneInterval: (user.pruneInterval || 4).toString(),
                trackBrowser: user.trackBrowser,
                startOfDay: user.startOfDay || "10:00",
                endOfDay: user.endOfDay || "19:00",
                launchAction: user.launchAction,
                rapidViews: user.rapidViews,
                projects: user.projects,
                storyPointField: user.storyPointField,
                epicNameField: user.epicNameField,
                commentLength: user.commentLength,
                startOfWeek: user.startOfWeek,
                hideDonateMenu: user.hideDonateMenu,
                highlightVariance: user.highlightVariance,
                notifyWL: user.notifyWL || user.notifyWL !== false
            };
            if (settings.launchAction && user.dashboards) {
                const idx = user.dashboards.indexOf(user.dashboards.first(d => d.isQuickView));
                settings.launchAction.quickIndex = `D-${idx}`;
            }
            const curDate = new Date();
            return {
                settings: settings,
                dateFormats: dateFormats.map((f) => { return { value: f, text: this.$utils.formatDate(curDate, f) }; }),
                timeFormats: timeFormats.map((f) => { return { value: f, text: this.$utils.formatDate(curDate, f) }; })
            };
        });
    }

    saveUserSettings(settings) {
        return this.$db.users.get(this.$session.userId).then((user) => {
            user.team = settings.teamMembers;
            user.autoUpload = settings.autoUpload;
            user.dateFormat = settings.dateFormat;
            user.maxHours = settings.maxHours;
            user.taskLogEnabled = settings.taskLogEnabled;
            user.timeFormat = settings.timeFormat;
            user.workingDays = settings.workingDays;
            user.uploadLogBy = settings.uploadLogBy;
            user.googleIntegration = settings.googleIntegration;
            user.notifyWL = settings.notifyWL;
            user.meetingTicket = settings.meetingTicket;
            user.pruneInterval = parseInt(settings.pruneInterval || 4);
            user.trackBrowser = settings.trackBrowser;
            user.startOfDay = settings.startOfDay;
            user.endOfDay = settings.endOfDay;
            user.highlightVariance = settings.highlightVariance;
            user.launchAction = settings.launchAction;
            user.allowClosedTickets = settings.allowClosedTickets;
            user.storyPointField = settings.storyPointField;
            user.epicNameField = settings.epicNameField;
            user.commentLength = parseInt(settings.commentLength || 0);
            user.startOfWeek = parseInt(settings.startOfWeek || 0);
            if (settings.hideDonateMenu) {
                user.hideDonateMenu = true;
            }
            else {
                delete user.hideDonateMenu;
            }
            if (user.launchAction && user.launchAction.action === 3) {
                const idx = parseInt((user.launchAction.quickIndex || '0').replace('D-', '')) || 0;
                delete user.launchAction.quickIndex;
                user.dashboards.forEach((dboard, i) => dboard.isQuickView = i === idx);
            }
            if (!settings.hasGoogleCredentials && user.dataStore) {
                const tokken = user.dataStore.access_token;
                if (tokken) {
                    this.$jaHttp.get(ApiUrls.googleLogoutUrl, tokken).then((response) => {
                        this.$jaBrowserExtn.removeAuthTokken(tokken);
                    });
                }
                delete user.dataStore;
            }
            if (settings.rapidViews && settings.rapidViews.length > 0) {
                user.rapidViews = settings.rapidViews;
            }
            else {
                delete user.rapidViews;
            }
            if (settings.projects && settings.projects.length > 0) {
                user.projects = settings.projects;
            }
            else {
                delete user.projects;
            }
            const autoLaunch = parseInt(settings.autoLaunch);
            if (autoLaunch > 0) {
                user.autoLaunch = autoLaunch;
            }
            else {
                delete user.autoLaunch;
            }
            const notifyBefore = parseInt(settings.notifyBefore);
            if (notifyBefore > 0) {
                user.notifyBefore = notifyBefore;
            }
            else {
                delete user.notifyBefore;
            }
            const checkUpdates = parseInt(settings.checkUpdates);
            if (checkUpdates > 0) {
                user.checkUpdates = checkUpdates;
            }
            else {
                delete user.checkUpdates;
            }
            user.timeFormat = settings.timeFormat;
            return this.$db.users.put(user).then(() => { this.$message.success("Settings saved successfully!"); return this.getUserSettings(); });
        });
    }
}
