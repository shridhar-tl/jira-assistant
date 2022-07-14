import React, { PureComponent } from 'react';

class StringEditor extends PureComponent {
    constructor(props) {
        super(props);
        this.state = { newValue: props.value };
    }

    editorKeyDown = (e) => {
        const { keyCode } = e;

        if (keyCode === 13) {
            this.onBlur(e);
        } else if (keyCode === 27) {
            this.onChange(this.props.value, false);
        }
    };

    onBlur = (e) => this.onChange(e.currentTarget.value, true);
    onChange = (value, modified) => this.props.onChange({ value }, modified);
    setFocus = (ref) => ref?.focus();

    valueChanged = (e) => this.setState({ newValue: e.currentTarget.value });

    render() {
        const { placeholder = "Enter value" } = this.props;

        return (
            <input ref={this.setFocus} type="text" className="string-editor" placeholder={placeholder}
                onBlur={this.onBlur} onKeyDown={this.editorKeyDown} />
        );
    }
}

export default StringEditor;