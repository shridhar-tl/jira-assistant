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
    render() {
        const { type, rounded, label, isLoading, icon, onClick, disabled, title, style } = this.props;
        let { className } = this.props;

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
