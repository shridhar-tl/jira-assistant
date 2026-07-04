import React from 'react';

import { inject } from '@services';

import { BuildDateTime } from '../../constants/common';

function BuildDate() {
    const value = React.useMemo(() => {
        const { $userutils } = inject('UserUtilsService');
        return $userutils.formatDateTime(BuildDateTime);
    }, []);

    return <span className="build-date">Build: {value}</span>;
}

export default BuildDate;
