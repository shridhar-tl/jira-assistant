import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';

class SelectBox extends PureComponent {
    constructor(props) {
        super(props);
        this.state = SelectBox.getDerivedStateFromProps(props, {}) || {};
    }

    static getDerivedStateFromProps(props, state) {
        var { value = null, valueField, multiselect, dataset } = props;
        var { subValue } = state;

        if (value !== subValue) {
            subValue = value;

            if (value && valueField) {
                if (multiselect) {
                    value = dataset.filter(d => value.indexOf(d[valueField]) >= 0);
                }
                else {
                    value = dataset.filter(d => d[valueField] === value)[0];
                }
            }

            return { subValue, value };
        }

        return null;
    }

    onChange = (e) => {
        var { value } = e;
        var subValue = value;

        var { multiselect, valueField } = this.props;

        if (valueField && valueField !== "value") {
            if (multiselect) {
                subValue = value.map(v => v[valueField]);
            }
            else {
                subValue = value[valueField];
            }
        }

        this.setState({ value, subValue });
        this.props.onChange(subValue);
    }

    render() {
        var {
            props: { displayField, placeholder, multiselect, dataset, style, className, filterPlaceholder },
            state: { value }
        } = this;

        var filter = dataset && dataset.length >= 15;

        if (multiselect) {
            return (
                <MultiSelect appendTo={document.body} value={value} optionLabel={displayField} options={dataset} filter={filter}
                    onChange={this.setValue} placeholder={placeholder} />
            );
        }
        else {
            return (
                <Dropdown appendTo={document.body} value={value} optionLabel={displayField} options={dataset} filter={filter} style={style} className={className}
                    onChange={this.onChange} placeholder={placeholder} filterPlaceholder={filterPlaceholder} />
            );
        }
    }
}

SelectBox.propTypes = {
    value: PropTypes.any.isRequired,
    dataset: PropTypes.array.isRequired,
    placeholder: PropTypes.string,
    onChange: PropTypes.func.isRequired
};

export default SelectBox;