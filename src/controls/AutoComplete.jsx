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
        const { valueField } = this.props;
        if (typeof value === 'object' && valueField && value[valueField]) {
            value = value[valueField];
        }

        this.setState({ value });
        const { onChange } = this.props;

        if (onChange) {
            onChange(value, this.props.field);
        }
    };

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
        // else if (Array.isArray(dataset)) {
        //    // ToDo: need to implement when needed
        //}
    };

    onKeyUp = (e) => {
        const { currentTarget, keyCode } = e;
        const { onCustomValue, onKeyUp } = this.props;

        if (keyCode === 13) {
            const value = currentTarget.value.trim();
            onCustomValue(value);
        }

        if (onKeyUp) {
            onKeyUp(e);
        }
    };

    render() {
        const {
            onChange, filterResult,
            props: { multiple, dropdown, displayField, children, placeholder, title,
                className, style, size, maxLength, scrollHeight, disabled, onCustomValue,
                autoFocus, onKeyUp, onFocus, onBlur, onSelect, onShow, onHide, forceSelection,
                optionGroupChildren, optionGroupTemplate, optionGroupLabel, completeMethod },
            state: { value, list }
        } = this;

        return (
            <AutoComplete appendTo={document.body} multiple={multiple} optionGroupChildren={optionGroupChildren}
                optionGroupTemplate={optionGroupTemplate} optionGroupLabel={optionGroupLabel}
                itemTemplate={children} dropdown={dropdown} field={displayField} placeholder={placeholder}
                tooltip={title} className={className} style={style} size={size} maxLength={maxLength}
                scrollHeight={scrollHeight} disabled={disabled} value={value} onChange={onChange}
                suggestions={list} completeMethod={completeMethod || filterResult} autoFocus={autoFocus}
                onKeyUp={onCustomValue ? this.onKeyUp : onKeyUp} onFocus={onFocus} onBlur={onBlur}
                onSelect={onSelect} onShow={onShow} onHide={onHide} forceSelection={forceSelection} />
        );
    }
}

export default AC;