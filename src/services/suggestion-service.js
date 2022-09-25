export default class SuggestionService {
    static dependencies = ["JiraService", "BookmarkService"];

    constructor($jira, $bookmark) {
        this.$jira = $jira;
        this.$bookmark = $bookmark;
    }

    async getTicketSuggestion(query, maxItems = 10, project = '') {
        const [bookmarks, openTickets] = await Promise.all([
            this.$bookmark.getBookmarks(),
            this.$jira.getTicketSuggestion()
        ]);

        let result = openTickets.map((t) => ({ value: t.key, label: `${t.key} - ${t.fields.summary}` }))
            .addRange(bookmarks.map((t) => ({ value: t.ticketNo, label: `${t.ticketNo} - ${t.summary}` })));

        if (query) {
            const qryToLower = query.toLowerCase();
            result = result.filter(t => t.label.toLowerCase().indexOf(qryToLower) >= 0);
        }

        if (result.length < maxItems) {
            const tMap = result.reduce((obj, t) => {
                obj[t.key] = true;
                return obj;
            }, {});
            const issues = await this.$jira.searchIssueForPicker(query, project ? { currentProjectId: project } : undefined);

            result.addRange(issues.filter(t => !tMap[t.key])
                .map(t => ({ value: t.key, label: `${t.key} - ${t.summaryText}`, iconUrl: t.img })));
        }

        return result;
    }
}