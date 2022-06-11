import { EventCategory } from "../_constants";

export default class BookmarkService {
    static dependencies = ["SessionService", "MessageService", "TicketService", "UserUtilsService", "AnalyticsService", 'SettingsService'];

    constructor($session, $message, $ticket, $userutils, $analytics, $settings) {
        this.$session = $session;
        this.$message = $message;
        this.$ticket = $ticket;
        this.$userutils = $userutils;
        this.$analytics = $analytics;
        this.$settings = $settings;
    }

    addBookmark(ticketNo, showMessage) {
        if (!ticketNo || ticketNo.length === 0) {
            this.$message.warning("No ticket number specified to bookmark");
            return Promise.reject("No ticket number specified to bookmark");
        }

        this.$analytics.trackEvent("Bookmark ticket", EventCategory.UserActions);

        return this.$settings.getGeneralSetting(this.$session.userId, 'favTicketList').then(favTickets => {
            if (!favTickets) {
                favTickets = [];
            }

            const pending = ticketNo.filter((t) => !favTickets.some((k) => k.toUpperCase() === t.toUpperCase()));
            if (pending.length === 0) {
                this.$message.warning(ticketNo.length === 1 ? `${ticketNo[0]} is already bookmarked` : "The specified ticket is already bookmarked");
                return [];
            }

            return this.$ticket.getTicketDetails(pending, true).then((issues) => {
                if (!issues || issues.length === 0) {
                    return ticketNo;
                }
                issues.forEach((i) => favTickets.push(i.key));

                return this.$settings.saveGeneralSetting(this.$session.userId, 'favTicketList', favTickets)
                    .then(() => {
                        if (showMessage) {
                            this.$message.success("Ticket(s) bookmarked successfully!");
                        }
                        return ticketNo.filter((t) => !favTickets.some((k) => k.toUpperCase() === t.toUpperCase()));
                    });
            });
        });
    }

    async removeBookmark(tickets) {
        if (typeof (tickets) === 'string') {
            tickets = [tickets];
        }

        this.$analytics.trackEvent("Remove bookmark", EventCategory.UserActions);

        let favTickets = await this.$settings.getGeneralSetting(this.$session.userId, 'favTicketList');
        if (!favTickets) {
            favTickets = [];
        }
        favTickets.removeAll(tickets);
        this.$settings.saveGeneralSetting(this.$session.userId, 'favTicketList', favTickets);
        return this.getBookmarks();
    }

    async getBookmarks() {
        const keys = await this.$settings.getGeneralSetting(this.$session.userId, 'favTicketList');

        return this.getBookmarkDetails(keys);
    }

    async getBookmarkDetails(keys) {
        if (keys && keys.length > 0) {
            return this.$ticket.getTicketDetails(keys, true).then((tickets) => {
                const result = tickets.map((i) => {
                    const keyIdx = keys.indexOf(i.key);
                    if (~keyIdx) {
                        keys.splice(keyIdx, 1);
                    } else {
                        this.addBookmark(i.key, false);
                    }

                    const fields = i.fields || {};
                    return {
                        ticketNo: i.key,
                        summary: fields.summary || "(unavailable)",
                        assigneeName: (fields.assignee || "").displayName,
                        reporterName: (fields.reporter || "").displayName,
                        issuetype: (fields.issuetype || {}).name,
                        issuetypeIcon: (fields.issuetype || {}).iconUrl,
                        priority: (fields.priority || {}).name,
                        priorityIcon: (fields.priority || {}).iconUrl,
                        statusIcon: (fields.status || {}).iconUrl,
                        status: (fields.status || {}).name,
                        resolutionIcon: (fields.resolution || {}).iconUrl,
                        resolution: (fields.resolution || {}).name,
                        createdSortable: fields.created,
                        updatedSortable: fields.updated,
                        created: this.$userutils.formatDateTime(fields.created),
                        updated: this.$userutils.formatDateTime(fields.updated)
                    };
                });

                if (keys.length) {
                    keys.forEach(k => result.push({ ticketNo: k, summary: '<<Ticket doesnt exist or you do not have permission>>' }));
                }

                return result;
            }, (err) => {
                const msg = ((err.error || {}).errorMessages || [])[0];
                if (msg && msg.indexOf('does not exist')) {
                    const bks = keys.filter(t => msg.indexOf(t) > -1);
                    if (bks.length > 0) {
                        return this.removeBookmark(bks);
                    }
                }
                return [];
            });
        }
        else {
            return [];
        }
    }
}