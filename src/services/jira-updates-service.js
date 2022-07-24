import moment from 'moment';
import { defaultSettings } from '../constants/settings';

export default class JiraUpdatesService {
    static dependencies = ["JiraService", "UserUtilsService", "SessionService"];

    constructor($jira, $userutils, $session) {
        this.$jira = $jira;
        this.$userutils = $userutils;
        this.$session = $session;
    }

    async getRescentUpdates(from = 7) {
        if (!from) {
            from = "-3d";
        }
        if (from instanceof Date) {
            from = `"${moment(from).format("YYYY-MM-DD HH:mm")}"`;
        }
        else if (typeof from === "number") {
            from = `-${from}d`;
        }

        const jql = (this.$session?.CurrentUser?.jiraUpdatesJQL || defaultSettings.jiraUpdatesJQL).replace(new RegExp('\\$date\\$', 'g'), from);

        const maxResults = 15;
        const issues = await this.$jira.searchTickets(jql,
            ["key", "lastViewed", "updated", "changeLog", "summary", "assignee", "reporter", "comments"],
            0, { expand: ["changelog"], maxResults });

        const updatedIssues = issues.filter(i => i.changelog?.histories &&
            (!i.fields?.lastViewed || moment(i.fields?.updated).isAfter(i.fields?.lastViewed))
        )
            .map(i => {
                const { changelog: { histories } = {}, key, fields: { summary, assignee, reporter, lastViewed } } = i;
                return { key, summary, assignee, reporter, lastViewed, histories };
            });

        const fields = await this.$jira.getCustomFields();
        const fieldNames = fields.reduce((obj, { id, name }) => {
            obj[id] = name;
            return obj;
        }, {});

        const notifications = this.extractUpdates(updatedIssues,
            this.$session.CurrentUser?.jiraUser?.emailAddress?.toLowerCase(), fieldNames);

        const list = notifications.groupBy("key").map(({ key, values }) => {
            const updates = values.sortBy("sortBy", true);
            const { date, sortBy, summary, reason } = updates[0];
            return { key, href: this.$userutils.getTicketUrl(key), date, sortBy, summary, reason, updates };
        });

        return { list, total: notifications.length, ticketCount: list.length };
    }

    extractUpdates(issues, currentUserEmail, fieldNames) {
        const result = [];

        issues.forEach(({ key, summary, assignee, reporter, lastViewed, histories, comments }) => {
            let reason = "";
            if (assignee?.emailAddress?.toLowerCase() === currentUserEmail) {
                reason = "assigned to you";
            }
            else if (reporter?.emailAddress?.toLowerCase() === currentUserEmail) {
                reason = "reported by you";
            }

            if (histories?.length) {
                histories.forEach(({ author, created, items }) => {
                    created = created && moment(created);
                    if (author?.emailAddress?.toLowerCase() !== currentUserEmail
                        && (!created || !lastViewed || created.isAfter(lastViewed))) {
                        const date = created.toDate();
                        const sortBy = date.getTime();
                        items.forEach(({ field, fromString, toString }) => {
                            if (!fromString) { fromString = "NONE"; }
                            result.push({ date, sortBy, author, field: fieldNames[field], fromString, toString, key, summary, reason });
                        });
                    }
                });
            }

            if (comments?.length) {
                // ToDo:
            }
        });

        return result;
    }
}