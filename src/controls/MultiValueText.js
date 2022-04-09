import React, { PureComponent } from 'react';
import { Chips } from 'primereact/chips';

class MultiValueText extends PureComponent {
    valueChanged = (e) => {
        this.props.onChange(e.value);
    };

    onBlur = (e) => {
        const ticket = e.currentTarget.value?.trim().toUpperCase();
        if (!ticket || ticket.length < 4) { return; }
        let { props: { value } } = this;
        value = value || [];
        if (!value.some(v => v.toUpperCase() === ticket)) {
            value = [...value, ticket];
            e.currentTarget.value = "";
            this.props.onChange(value);
        }
    };

    render() {
        const { props: { value, placeholder } } = this;

        return <Chips value={value} onChange={this.valueChanged} placeholder={placeholder} onBlur={this.onBlur} separator="," />;
    }
}

export default MultiValueText;