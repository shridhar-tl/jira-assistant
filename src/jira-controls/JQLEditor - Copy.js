import React, { PureComponent } from 'react';
import { AutoComplete } from 'primereact/autocomplete';
import { inject } from '../services/injector-service';
import './Common.scss';

const defaultOperators = [];

const jqlParser = /\(? *(?: *(\w+|".*?"|cf\[\d+\]) *(?:(?:((?!and|or)=|!=|<=|>=|>|<|is +not|is|(?:.*){1,9}$) *((?!and|or)|\w+(?:\(\))?|".*?"| .*? | *$)|(in|not +in) *(\(.*?\)| *$)))? *\)?) *((?:and|or)|$)/g;

class JQLEditor extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, 'JiraService', 'AjaxService');
        this.state = {};
    }

    async componentDidMount() {
        const allList = await this.$jira.getJQLAutocomplete();
        console.log("All List", allList);
        const { visibleFieldNames } = allList;

        this.visibleFieldNames = visibleFieldNames.map(f => (
            {
                value: f.value, label: f.displayName,
                operators: f.operators?.map(o => ({ value: o, label: o })),
                search: f.displayName.toLowerCase()
            }
        ));

        this.visibleFieldMap = this.visibleFieldNames.reduce((mapper, f) => {
            mapper[f.value.toLowerCase()] = f;
            return mapper;
        }, {});
    }

    validationRequest = async jql => {
        try {
            await this.$ajax.request('get', `~/rest/api/2/search?startAt=0&maxResults=1&validateQuery=strict&fields=summary&jql=${jql}`, null, null, true);
            this.setState({ jqlValid: true });
        } catch ({ error: { errorMessages } }) {
            this.setState({ jqlValid: true, errorMessages });
        }
    };

    setFieldValue = async (fieldName, fieldValue) => {
        const { results } = await this.$jira.getJQLSuggestions(fieldName, fieldValue);
        const suggestions = results.map(f => ({ value: f.value, label: f.displayName }));
        this.setState({ suggestions });
    };

    showSuggestions = (e) => {
        const pos = this.cursorPosition;
        const { query } = e;
        const { jql } = this.props;

        let found;
        let lastIndex = -1;
        jqlParser.lastIndex = 0;
        while ((found = jqlParser.exec(query))) {
            if (found.index === lastIndex) {
                break;
            }

            const [full, field, comparer1, value1, comparer = comparer1, value = value1] = found;

            lastIndex = found.index;

            const start = lastIndex + full.indexOf(field);
            const end = lastIndex + full.length;
            const cStart = lastIndex + (comparer ? full.indexOf(comparer, field.length) : field.length);
            const afterComparer = comparer && jql[cStart + comparer.length];
            const vStart = afterComparer ? start + (value ? full.indexOf(value, cStart) : cStart + comparer.length) : null;

            if (pos <= end) {
                const fieldToLower = field.toLowerCase();

                if (pos >= cStart && (field.length === full.length || (full.indexOf(field) + field.length) === full.length)) {
                    this.clearStart = start;
                    this.clearEnd = cStart;

                    const suggestions = this.visibleFieldNames
                        .filter(f => f.search.indexOf(fieldToLower) > -1);
                    this.setState({ suggestions });

                    break;
                }

                if (pos >= cStart && (pos < vStart || !vStart)) {
                    let suggestions = this.visibleFieldMap[fieldToLower]?.operators || defaultOperators;
                    const cmp = comparer?.trim();
                    this.clearStart = cStart;
                    this.clearEnd = cStart;

                    if (cmp) {
                        suggestions = suggestions.filter(o => o.label.indexOf(cmp) > -1);
                        this.clearEnd = cStart + comparer.length;
                    }

                    this.setState({ suggestions });

                    break;
                }

                if (pos >= vStart && pos <= end) {
                    this.clearStart = vStart;
                    this.clearEnd = end;
                    this.setFieldValue(field, value);
                }
            }
        }
    };

    jqlChanged = (e) => {
        if (e.originalEvent.type !== 'change') {
            return;
        }

        const { originalEvent: { currentTarget }, value } = e;
        const { selectionStart } = currentTarget;
        this.cursorPosition = selectionStart;
        this.props.onChange(value);
        this.setState({ suggestions: null });
    };

    suggestionSelected = (e) => {
        const { clearStart, clearEnd, props: { jql, onChange } } = this;
        const space = jql.length > this.pos ? ' ' : '';
        const { value } = e;
        const val = `${jql.substring(0, clearStart)}"${value.value}"${space}${jql.substring(clearEnd)}`;
        this.input.value = val;
        onChange(val);
    };

    setInput = ({ inputEl }) => this.input = inputEl;

    render() {
        const { jql } = this.props;
        const { suggestions } = this.state;

        return (
            <div className="jql-editor">
                <AutoComplete ref={this.setInput} className="jql-query"
                    field="label"
                    value={jql} suggestions={suggestions}
                    completeMethod={this.showSuggestions}
                    onChange={this.jqlChanged}
                    onSelect={this.suggestionSelected} />
                JQL: {jql};
                Start: {this.clearStart};
                End: {this.clearEnd};
            </div>
        );
    }
}

export default JQLEditor;