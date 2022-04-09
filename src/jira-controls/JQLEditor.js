import React, { PureComponent } from 'react';
import TextBox from '../controls/TextBox';
import './Common.scss';

class JQLEditor extends PureComponent {
    onChange = (val) => {
        this.props.onChange(val?.trim(), null);
    };

    render() {
        const { jql } = this.props;

        return (
            <div className="jql-editor">
                <TextBox className="jql-query" multiline={true}
                    placeholder="JQL query to fetch data"
                    value={jql} onChange={this.onChange} />
            </div>
        );
    }
}

export default JQLEditor;