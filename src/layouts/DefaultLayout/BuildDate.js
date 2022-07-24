import React, { PureComponent } from 'react';
import { BuildDateTime } from '../../constants/common';
import { inject } from '../../services/injector-service';

class BuildDate extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, 'UserUtilsService');
        this.value = this.$userutils.formatDateTime(BuildDateTime);
    }

    render() { return (<span className="build-date">Build: {this.value}</span>); }
}

export default BuildDate;