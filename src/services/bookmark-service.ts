import { EventCategory } from '@/constants';

import type AnalyticsService from './analytics-service';
import type MessageService from './message-service';
import type SessionService from './session-service';
import type SettingsService from './settings-service';
import type TicketService from './ticket-service';
import type UserUtilsService from './userutils-service';

export default class BookmarkService {
    static dependencies = ['SessionService', 'MessageService', 'TicketService', 'UserUtilsService', 'AnalyticsService', 'SettingsService'];

    private $session: SessionService;
    private $message: MessageService;
    private $ticket: TicketService;
    private $userutils: UserUtilsService;
    private $analytics: AnalyticsService;
    private $settings: SettingsService;

    constructor(
        $session: SessionService,
        $message: MessageService,
        $ticket: TicketService,
        $userutils: UserUtilsService,
        $analytics: AnalyticsService,
        $settings: SettingsService,
    ) {
        this.$session = $session;
        this.$message = $message;
        this.$ticket = $ticket;
        this.$userutils = $userutils;
        this.$analytics = $analytics;
        this.$settings = $settings;
    }

    async addBookmark(ticketNo: string[], showMessage?: boolean): Promise<string[]> {
        if (!ticketNo || ticketNo.length === 0) {
            this.$message.warning('No ticket number specified to bookmark');
            return Promise.reject('No ticket number specified to bookmark');
        }

        this.$analytics.trackEvent('Bookmark ticket', EventCategory.UserActions);

        const favTickets = (await this.$settings.getGeneralSetting(this.$session.userId!, 'favTicketList')) || [];

        const pending = ticketNo.filter((t: any) => !favTickets.some((k: string) => k.toUpperCase() === t.toUpperCase()));
        if (pending.length === 0) {
            this.$message.warning(
                ticketNo.length === 1 ? `${ticketNo[0]} is already bookmarked` : 'The specified ticket is already bookmarked',
            );
            return [];
        }

        const issues = await this.$ticket.getTicketDetails(pending, true);
        if (!issues || issues.length === 0) {
            return ticketNo;
        }
        issues.forEach((i: any) => favTickets.push(i.key));

        await this.$settings.saveGeneralSetting(this.$session.userId!, 'favTicketList', favTickets);
        if (showMessage) {
            this.$message.success('Ticket(s) bookmarked successfully!');
        }
        return ticketNo.filter((t: any) => !favTickets.some((k: string) => k.toUpperCase() === t.toUpperCase()));
    }

    async removeBookmark(tickets: string | string[]): Promise<any[]> {
        if (typeof tickets === 'string') {
            tickets = [tickets];
        }

        this.$analytics.trackEvent('Remove bookmark', EventCategory.UserActions);

        let favTickets = (await this.getIssueKeys()) || [];
        favTickets = favTickets.filter((t: string) => !tickets.includes(t));
        await this.$settings.saveGeneralSetting(this.$session.userId!, 'favTicketList', favTickets);
        return this.getBookmarks();
    }

    async getBookmarks(): Promise<any[]> {
        const keys = await this.getIssueKeys();
        return this.getBookmarkDetails(keys);
    }

    getIssueKeys(): Promise<string[]> {
        return this.$settings.getGeneralSetting(this.$session.userId!, 'favTicketList');
    }

    async getBookmarkDetails(keys: string[]): Promise<any[]> {
        if (keys && keys.length > 0) {
            try {
                const tickets = await this.$ticket.getTicketDetails(keys, true);
                const result = tickets.map((i: any) => {
                    const keyIdx = keys.indexOf(i.key);
                    if (~keyIdx) {
                        keys.splice(keyIdx, 1);
                    } else {
                        this.addBookmark([i.key], false);
                    }

                    const fields = i.fields || {};
                    return {
                        ticketNo: i.key,
                        summary: fields.summary || '(unavailable)',
                        assigneeName: (fields.assignee || '').displayName,
                        reporterName: (fields.reporter || '').displayName,
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
                        updated: this.$userutils.formatDateTime(fields.updated),
                    };
                });

                if (keys.length) {
                    keys.forEach((k: any) =>
                        result.push({ ticketNo: k, summary: '<<Ticket doesnt exist or you do not have permission>>' }),
                    );
                }

                return result;
            } catch (err: any) {
                const msg = ((err.error || {}).errorMessages || [])[0];
                if (msg && msg.indexOf('does not exist') > -1) {
                    const bks = keys.filter((t: any) => msg.indexOf(t) > -1);
                    if (bks.length > 0) {
                        return this.removeBookmark(bks);
                    }
                }
                return [];
            }
        } else {
            return [];
        }
    }
}
