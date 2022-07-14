import { inject } from '../services/injector-service';
import AutoCompleteEditor from './AutoCompleteEditor';

class ProjectEditor extends AutoCompleteEditor {
    constructor(props) {
        super(props);
        inject(this, 'JiraService', 'CacheService');
        this.placeholder = "Enter Project key";
        this.loadProjects();
    }

    getItem = (value) => {
        const valueToLower = value.trim().toLowerCase();
        const item = this.projects.filter(p => p.value.toLowerCase() === valueToLower)[0];
        if (item) {
            return { value: item.value, displayText: item.displayText, avatarUrl: item.iconUrl };
        } else {
            return { value };
        }
    };

    loadProjects() {
        this.projects = [];
        const value = this.$cache.session.get("projectsForEditor");

        if (value) {
            this.projects = value;
        } else {
            this.$jira.getProjects().then(projects => {
                this.projects = projects.map(p => ({
                    value: p.key,
                    displayText: p.name,
                    label: `${p.key} - ${p.name}`,
                    iconUrl: p.avatarUrls['16x16'] || p.avatarUrls['24x24']
                }));
                this.$cache.session.set("projectsForEditor", this.projects, 10);
            });
        }
    }

    search = (qry) => {
        const qryToLower = qry.toLowerCase();
        return this.projects.filter(p => p.label.toLowerCase().indexOf(qryToLower) > -1);
    };
}

export default ProjectEditor;