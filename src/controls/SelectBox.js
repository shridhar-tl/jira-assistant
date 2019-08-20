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
        var { value = null, valueField, multiselect, dataset, group } = props;
        var { subValue } = state;

        var newState = null;

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

            newState = { subValue, value };
        }

        if (group && dataset !== state.dataset) {
            newState = newState || {};
            newState.dataset = dataset;
            var groupedDataset = [];

            dataset.forEach(grp => {
                const grpWrap = { isGroup: true, value: grp };
                if (props.displayField) {
                    grpWrap[props.displayField] = "";
                }
                groupedDataset.push(grpWrap);
                grp.items.forEach(itm => groupedDataset.push(itm));
            });

            newState.groupedDataset = groupedDataset;
        }

        return newState;
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
            props: { displayField, placeholder, multiselect, dataset, style, className, filterPlaceholder, group, children },
            state: { value, groupedDataset }
        } = this;
        let itemTemplate = null;

        if (group) {
            dataset = groupedDataset;
            itemTemplate = (itm, i) => {
                if (itm.isGroup) {
                    return children[1](itm.value, i);
                } else {
                    return children[0](itm, i);
                }
            };
        }

        const filter = dataset && dataset.length >= 15;

        if (multiselect) {
            return (
                <MultiSelect appendTo={document.body} value={value} optionLabel={displayField} options={dataset} filter={filter}
                    onChange={this.setValue} placeholder={placeholder} />
            );
        }
        else {
            return (
                <Dropdown appendTo={document.body} value={value} optionLabel={displayField} options={dataset} filter={filter} style={style} className={className}
                    onChange={this.onChange} placeholder={placeholder} filterPlaceholder={filterPlaceholder} itemTemplate={itemTemplate} />
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