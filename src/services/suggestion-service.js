export default class SuggestionService {
    static dependencies = ["JiraService", "BookmarkService"];

    constructor($jira, $bookmark) {
        this.$jira = $jira;
        this.$bookmark = $bookmark;
    }

    getTicketSuggestion() {
        return Promise.all([
            this.$bookmark.getBookmarks(),
            this.$jira.getOpenTickets()
        ]).then((result) => {
            return result[1].map((t) => { return { value: t.key, label: `${t.key} - ${t.fields.summary}` }; })
                .addRange(result[0].map((t) => { return { value: t.ticketNo, label: `${t.ticketNo} - ${t.summary}` }; }));
        });
    }
}