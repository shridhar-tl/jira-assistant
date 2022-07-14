import React, { PureComponent } from 'react';
import { AutoComplete, Image } from '../controls';

const itemStyle = { fontSize: 12, margin: '10px 10px 0 0' };
class AutoCompleteEditor extends PureComponent {
    validateKeys = (e) => {
        const { keyCode } = e;

        if (keyCode === 13) {
            this.onBlur(e);
        } else if (keyCode === 27) {
            this.onChange(null, false);
        }
    };

    getItem = (value) => ({ value });
    setFocus = () => this.onFocus = true;
    onBlur = (e) => {
        if (!this.isShowing) {
            this.onChange(this.getItem(e.currentTarget.value), true);
        }
        this.onFocus = false;
    };

    onChange = (value, modified) => this.props.onChange(value, modified);

    onSelect = ({ value: item }) => {
        const { value, displayText, iconUrl: avatarUrl } = item;
        this.onChange({ value, displayText, avatarUrl }, true);
    };

    onShow = () => this.isShowing = true;
    onHide = () => {
        this.isShowing = false;
        if (!this.onFocus) {
            this.onChange(null, false);
        }
    };

    renderTemplate = (item) => <span style={itemStyle}>{!!item.iconUrl && <Image src={item.iconUrl} />} {item.label}</span>;

    render() {
        const { value, placeholder = this.placeholder, className, multiple } = this.props;

        return (
            <AutoComplete value={value} displayField="value" className={className}
                multiple={multiple}
                placeholder={placeholder}
                dataset={this.search} maxLength={20}
                autoFocus onKeyUp={this.validateKeys} onSelect={this.onSelect}
                onShow={this.onShow} onHide={this.onHide} onBlur={this.onBlur} onFocus={this.setFocus}
            >
                {this.renderTemplate}
            </AutoComplete>
        );
    }
}

export default AutoCompleteEditor;