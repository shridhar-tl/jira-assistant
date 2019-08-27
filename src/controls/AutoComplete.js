import React, { PureComponent } from 'react';
import { AutoComplete } from 'primereact/autocomplete';

class AC extends PureComponent {
    constructor(props) {
        super(props);
        let { value } = props;
        value = value || "";
        this.state = { value };
    }

    UNSAFE_componentWillReceiveProps(props) {
        if (this.state.value !== props.value) {
            this.setState({ value: props.value });
        }
    }

    onChange = ({ value }) => {
        this.setState({ value });
        this.props.onChange(value);
    }

    filterResult = ({ query }) => {
        const { dataset } = this.props;

        if (typeof dataset === "function") {
            const result = dataset(query);
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
        const {
            onChange, filterResult,
            props: { multiple, dropdown, displayField, children, placeholder, title, className, style, size, maxlength, scrollHeight, disabled },
            state: { value, list }
        } = this;

        return (
            <AutoComplete appendTo={document.body} multiple={multiple} itemTemplate={children} dropdown={dropdown}
                field={displayField} placeholder={placeholder} tooltip={title} className={className} style={style}
                size={size} maxlength={maxlength} scrollHeight={scrollHeight} disabled={disabled}
                value={value} onChange={onChange} suggestions={list} completeMethod={filterResult} />
        );
    }
}

export default AC;