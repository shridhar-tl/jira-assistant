import { inject } from '../services/injector-service';
import AutoCompleteEditor from './AutoCompleteEditor';

class IssueKeyEditor extends AutoCompleteEditor {
    constructor(props) {
        super(props);
        inject(this, 'SuggestionService');
        this.placeholder = "Enter Jira Issue key";
    }

    search = async (qry) => this.$suggestion.getTicketSuggestion(qry);
}

export default IssueKeyEditor;