import React, { PureComponent } from 'react';
import { Panel } from 'primereact/panel';
import { Accordion, AccordionTab } from 'primereact/accordion';
import faqArray from './faqdata.json';
import { AutoComplete, Button } from '../../controls/index.js';
import './FaqView.scss';

class FaqView extends PureComponent {
    constructor(props) {
        super(props);
        const { match: { params } } = props;
        this.state = { searchText: (params['query'] || "").trim() };
    }

    componentDidMount() {
        if (this.state.searchText.length > 0) {
            this.search();
        }
    }

    getSuggestion(query) {
        query = query.toLowerCase();

        if (!query) {
            return;
        }

        return faqArray.union(f => {
            return f.questions.filter(q => q.toLowerCase().indexOf(query) > -1).map(q => { return { id: f.id, text: q }; }).take(1);
        });
    }

    search = (e) => {
        //ToDo handle enter key press .enter
        const query = this.state.searchText;

        if (typeof query === "string") {
            this.setState({
                searchResults: faqArray.filter(f => {
                    return f.questions.some(q => q.toLowerCase().indexOf(query) > -1)
                        || f.strand.toLowerCase().indexOf(query) > -1
                        || f.description.toLowerCase().indexOf(query) > -1
                        || (f.keywords && f.keywords.some(k => k.toLowerCase().indexOf(query) > -1 || query.indexOf(k) > -1));
                })
            });
        }
        else {
            const option = faqArray.first(f => f.id === query.id);
            this.setState({ searchResults: [option] });
        }
    }

    getDescription(res) {
        const descr = res.description;
        const lines = descr.split('\n');
        let result = "";
        lines.forEach((str, idx, opt) => {
            const curOpts = this.getLineOpts(str);
            const prevOpts = this.getLineOpts(opt.prev);
            if (curOpts.isList) {
                if (!prevOpts.isList) {
                    result += `<${curOpts.listType}>`;
                }
                result += curOpts.html;
            }
            else {
                if (prevOpts.isList) {
                    result += `</${prevOpts.listType}>`;
                }
                result += curOpts.html;
            }
        });
        // .replace(/(\n)/g, "<br />");
        return result;
    }

    getLineOpts(str) {
        if (!str) {
            return false;
        }

        const isNextLvl = str.charAt(0) === '>';
        const isOL = str.charAt(isNextLvl ? 1 : 0) === '-';
        const isUL = str.charAt(isNextLvl ? 1 : 0) === '*';
        const isList = isOL || isUL;
        let line = str.substring((isNextLvl ? 1 : 0) + (isList ? 1 : 0)).trim();
        line = line.replace(/~(.*)~/g, '<i class="fa $1"></i>');
        let listType = null;

        if (isList) {
            line = `<li>${line}</li>`;
            listType = isOL ? 'ol' : 'ul';
        }
        else {
            line += '<br />';
        }

        return { isList: isList, subLevel: isNextLvl, isOL, isUL, listType: listType, html: line };
    }

    getInterestText(id) {
        if (!id) {
            return;
        }

        const item = faqArray.first(f => f.id === id);
        if (item) {
            return item.strand;
        }
        else {
            console.error("No faq found, ID=", id);
        }
    }

    addInterest(id) {
        if (!id) {
            return;
        }
        const newResult = faqArray.first(f => f.id === id);

        if (this.state.searchResults.indexOf(newResult) === -1) {
            this.setState({ searchResults: this.state.searchResults.concat(newResult) });
        }
    }

    render() {
        const {
            search,
            state: { searchText, searchResults }
        } = this;

        return (
            <div className="widget-cntr width-perc-100">
                <Panel styleclass="p-no-padding" showheader={false}>
                    <div className="search-box">
                        <div>
                            <span className="title-text">Search for a feature or FAQs:</span>
                            <AutoComplete value={searchText} onChange={(val) => this.setState({ searchText: val })} displayField="text"
                                className="faq-sug" minLength={3}
                                placeholder="Ask a question or the name of the feature you would like to know about" dataset={this.getSuggestion} onKeydown={this.search} />
                            <Button label="Search" icon="fa fa-search" onClick={search} disabled={!searchText} />
                            <span className="link" onClick={() => this.setState({ searchText: null })}>Clear text</span>
                        </div>
                    </div>

                    <Accordion styleclass="search-results">
                        {searchResults && searchResults.map(res => <AccordionTab key={res.id} header={res.strand} contentClassName="result">
                            <div className="descr" dangerouslySetInnerHTML={{ __html: this.getDescription(res) }} />
                            {res.links && res.links.length > 0 && <div className="interests">
                                <span>You may also need to look at:</span>
                                <ul className="tags">
                                    {res.links.map(id => <li key={id} onClick={() => this.addInterest(id)} className="badge badge-pill skin-bg-font">
                                        {this.getInterestText(id)}
                                    </li>)}
                                </ul>
                            </div>}
                        </AccordionTab>)}
                    </Accordion>

                    {searchText && searchResults && searchResults.length === 0 && <div className="no-results" >
                        <h4>Oops! we couldn't find anything related to your query.</h4>
                        <span>For better results ask a question or type a word about the functionality / module. Below are some examples:</span>
                        <ul>
                            <li>How can I edit the name of dashboard?</li>
                            <li>edit layout</li>
                            <li>dashboard</li>
                        </ul>
                        <p>If you did not find anything appropriate for your question, you can <a href="#/feedback">Contact us</a></p>
                    </div>}
                </Panel>
            </div>
        );
    }
}

export default FaqView;