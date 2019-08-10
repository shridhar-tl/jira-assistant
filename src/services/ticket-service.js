export default class TicketService {
    static dependencies = ["JiraService"];

    constructor($jira, $bookmark) {
        this.$jira = $jira;

        this.ticketsCache = {};
    }

    getTicketDetails(tickets, asArr) {
        if (!tickets) {
            return null;
        }
        var onlyOne = false;
        if (typeof tickets === "string") {
            tickets = [tickets];
            onlyOne = true;
        }
        return this.fetchTicketDetails(tickets, ["summary", "assignee", "reporter", "priority", "status", "resolution", "created", "updated", "issuetype", "parent"]).then((arr) => {
            var result = {};
            arr.forEach((t) => {
                this.ticketsCache[t.key.toUpperCase()] = t;
                if (!asArr) {
                    result[t.key] = t;
                }
            });
            if (onlyOne) {
                return arr[0];
            }
            return asArr ? arr : result;
        });
    }

    fetchTicketDetails(tickets, fields) {
        var result = [];
        var toFetch = [];
        tickets.forEach((t) => {
            if (!this.ticketsCache[t]) {
                toFetch.push(t);
            }
            else {
                result.push(this.ticketsCache[t]);
            }
        });
        if (toFetch.length > 0) {
            var jql = "'" + toFetch.join("', '") + "'";
            jql = "key in (" + jql + ")";
            return this.$jira.searchTickets(jql, fields).then((list) => {
                result.addRange(list);
                return result;
            });
        }
        else {
            return Promise.resolve(result);
        }
    }
}