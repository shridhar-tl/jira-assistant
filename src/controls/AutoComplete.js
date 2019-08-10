import React, { PureComponent } from 'react';
import { AutoComplete } from 'primereact/autocomplete';

class AC extends PureComponent {
    constructor(props) {
        super(props);
        var { value } = props;
        value = value || "";
        this.state = { value };
    }

    onChange = ({ value }) => {
        this.setState({ value });
        this.props.onChange(value);
    }

    filterResult = ({ query }) => {
        var { dataset } = this.props;

        if (typeof dataset === "function") {
            var result = dataset(query);
            if (Array.isArray(result)) {
                this.setState({ list: result });
                return;
            }
            else if (typeof result.then === "function") {
                result.then(list => this.setState({ list }));
            }
        }
        else if (Array.isArray(dataset)) {
            // ToDo: need to implement when needed
        }
    }

    render() {
        var {
            onChange, filterResult,
            props: { multiple, dropdown, displayField, children, placeholder, title, className, style },
            state: { value, list }
        } = this;

        return (
            <AutoComplete appendTo={document.body} multiple={multiple} itemTemplate={children} dropdown={dropdown}
                field={displayField} placeholder={placeholder} tooltip={title} className={className} style={style}
                value={value} onChange={onChange} suggestions={list} completeMethod={filterResult} />
        );
    }
}

export default AC;