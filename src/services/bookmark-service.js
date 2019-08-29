export default class BookmarkService {
    static dependencies = ["UserService", "SessionService", "MessageService", "TicketService", "UserUtilsService"];

    constructor($user, $session, $message, $ticket, $userutils) {
        this.$user = $user;
        this.$session = $session;
        this.$message = $message;
        this.$ticket = $ticket;
        this.$userutils = $userutils;
    }

    addBookmark(ticketNo) {
        if (!ticketNo || ticketNo.length === 0) {
            this.$message.warning("No ticket number specified to bookmark");
            return Promise.reject("No ticket number specified to bookmark");
        }

        return this.$user.getUser(this.$session.userId).then((u) => {
            let favTickets = u.favTicketList;
            if (!favTickets) {
                favTickets = [];
            }

            const pending = ticketNo.filter((t) => { return !favTickets.some((k) => { return k.toUpperCase() === t.toUpperCase(); }); });
            if (pending.length === 0) {
                this.$message.warning(ticketNo.length === 1 ? `${ticketNo[0]} is already bookmarked` : "The specified ticket is already bookmarked");
                return [];
            }

            return this.$ticket.getTicketDetails(pending, true).then((issues) => {
                if (!issues || issues.length === 0) {
                    return ticketNo;
                }
                issues.forEach((i) => { return favTickets.push(i.key); });
                u.favTicketList = favTickets;
                return this.$user.saveUser(u).then(() => { return ticketNo.filter((t) => { return !favTickets.some((k) => { return k.toUpperCase() === t.toUpperCase(); }); }); });
            });
        });
    }

    removeBookmark(tickets) {
        if (typeof (tickets) === 'string') {
            tickets = [tickets];
        }

        return this.$user.getUser(this.$session.userId).then((u) => {
            let favTickets = u.favTicketList;
            if (!favTickets) {
                favTickets = [];
            }
            favTickets.removeAll(tickets);
            u.favTicketList = favTickets;
            return this.$user.saveUser(u).then(() => { return this.getBookmarks(); });
        });
    }

    getBookmarks() {
        return this.$user.getUser(this.$session.userId).then((u) => {
            const tickets = u.favTicketList;
            if (tickets && tickets.length > 0) {
                return this.$ticket.getTicketDetails(tickets, true).then((tickets) => {
                    return tickets.map((i) => {
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
                }, (err) => {
                    const msg = ((err.error || {}).errorMessages || [])[0];
                    if (msg && msg.indexOf('does not exist')) {
                        const bks = tickets.filter(t => msg.indexOf(t) > -1);
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
        });
    }
}