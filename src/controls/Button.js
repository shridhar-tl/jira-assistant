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
        var { type, className, rounded, label } = this.props;
        var btnClass = "rb-button " + (buttonTypes[type] || "");
        if (rounded) {
            btnClass += " p-button-rounded ";
        }
        if (!label) {
            btnClass += " ui-button-icon-only ";
        }
        className = className || "";
        var props = { ...this.props, className: btnClass + " " + className };
        return <PrimeButton {...props} />;
    }
}

export default Button;
