import React from 'react';
import { BuildDateTime } from '../../constants/common';
import { inject } from '../../services/injector-service';

function BuildDate() {
    const value = React.useMemo(() => {
        const { $userutils } = inject(this, 'UserUtilsService');
        return $userutils.formatDateTime(BuildDateTime);
    }, []);

    return (<span className="build-date">Build: {value}</span>);
}

export default BuildDate;