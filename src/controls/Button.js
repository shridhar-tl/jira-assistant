import React, { PureComponent } from "react";
import { Button as PrimeButton } from "primereact/button";
import "./Button.scss";

const buttonTypes = {
    danger: "p-button-danger",
    success: "p-button-success",
    secondary: "p-button-secondary",
    warning: "p-button-warning",
    info: "p-button-info",
    primary: "",
    default: ""
};

class Button extends PureComponent {
    state = {};
    componentDidMount() {
        const { waitFor = 0 } = this.props;

        if (waitFor > 0) {
            this.setState({ waitFor });
            const hndl = setInterval(() => {
                const { waitFor: wf } = this.state;
                this.setState({ waitFor: wf - 1 });
                if (wf <= 1) {
                    clearInterval(hndl);
                }
            }, 1000);
        }
    }

    render() {
        const { type, rounded, isLoading, icon, onClick, title, style } = this.props;
        let { className, disabled, label } = this.props;
        const { waitFor } = this.state;

        if (waitFor > 0) {
            disabled = true;
            label += ` (${waitFor})`;
        }

        let btnClass = `rb-button ${buttonTypes[type] || ""}`;
        if (rounded) {
            btnClass += " p-button-rounded ";
        }
        if (!label) {
            btnClass += " ui-button-icon-only ";
        }
        className = className || "";

        const props = { label, icon, onClick, disabled, title, style, className: `${btnClass} ${className}` };
        if (isLoading) {
            props.icon = "fa fa-spinner fa-spin";
        }
        return <PrimeButton {...props} />;
    }
}

export default Button;
