import { inject } from '../services/injector-service';
import AutoCompleteEditor from './AutoCompleteEditor';

class IssueKeyEditor extends AutoCompleteEditor {
    constructor(props) {
        super(props);
        inject(this, 'JiraService');
        this.placeholder = "Enter Jira Issue key";
    }

    search = async (qry) => {
        const issues = await this.$jira.searchIssueForPicker(qry, { currentJQL: '' });

        return issues.map(t => ({ value: t.key, label: `${t.key} - ${t.summaryText}`, iconUrl: t.img }));
    };
}

export default IssueKeyEditor;