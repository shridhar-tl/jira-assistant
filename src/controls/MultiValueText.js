import React, { PureComponent } from 'react';
import { Chips } from 'primereact/chips';

class MultiValueText extends PureComponent {
    valueChanged = (e) => {
        this.props.onChange(e.value);
    }

    render() {
        var { props: { value, placeholder } } = this;

        return <Chips value={value} onChange={this.valueChanged} placeholder={placeholder} />
    }
}

MultiValueText.propTypes = {

};

export default MultiValueText;