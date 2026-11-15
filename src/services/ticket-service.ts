import { distinct } from '@utils/array-utils';

import type JiraService from './jira-service';

const commonTicketFields = [
    'summary',
    'assignee',
    'reporter',
    'priority',
    'status',
    'resolution',
    'created',
    'updated',
    'issuetype',
    'parent',
];

export default class TicketService {
    static dependencies = ['JiraService'];

    private $jira: JiraService;
    private ticketsCache: Record<string, any> = {};

    constructor($jira: JiraService) {
        this.$jira = $jira;
    }

    /**
     * Get ticket details - main entry point for fetching tickets
     */
    async getTicketDetails(
        tickets: string | string[],
        asArr?: boolean,
        ticketFields?: string[],
        options?: { allowCache?: boolean; ignoreErrors?: boolean; ignoreWarnings?: boolean },
    ): Promise<any> {
        if (!tickets) return null;

        let onlyOne = false;
        let ticketList: string[];

        if (typeof tickets === 'string') {
            ticketList = [tickets];
            onlyOne = true;
        } else {
            ticketList = tickets;
        }

        const { allowCache, ...opts } = options || {};
        const fields = ticketFields || commonTicketFields;

        const arr = await this.fetchTicketDetails(ticketList, fields, opts);
        const result: Record<string, any> = {};

        arr.forEach((t: any) => {
            if (allowCache !== false) {
                this.ticketsCache[t.key.toUpperCase()] = t;
            }
            if (!asArr) {
                result[t.key] = t;
            }
        });

        if (onlyOne) {
            return arr[0];
        }

        return asArr ? arr : result;
    }

    /**
     * Internal method to fetch ticket details with caching
     */
    private async fetchTicketDetails(tickets: string[], fields: string[], opts?: any): Promise<any[]> {
        const result: any[] = [];
        const toFetch: string[] = [];
        const uniqueTickets = distinct(tickets, (t: any) => t);

        uniqueTickets.forEach((t: any) => {
            const cached = this.ticketsCache[t];
            if (!cached) {
                toFetch.push(t);
            } else {
                result.push(cached);
            }
        });

        if (toFetch.length > 0) {
            const jql = `key in ('${toFetch.join("', '")}')`;
            try {
                const list = await this.$jira.searchTickets(jql, fields, undefined, opts);
                result.push(...list);
            } catch (err) {
                console.error('Error fetching tickets:', err);
            }
        }

        return result;
    }
}
