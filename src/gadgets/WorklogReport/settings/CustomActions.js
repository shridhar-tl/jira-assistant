import React, { useEffect, useRef } from 'react';
import { Button, DatePicker } from '../../../controls';
import { connect } from '../datastore';
import { setValue } from './actions';
import ChooseSprint from './ChooseBoard';

const CustomActions = connect(function ({
    userListMode, timeframeType,
    showGroupsPopup, onInputChanged
}) {
    return <>
        {timeframeType === '1' && <ChooseSprint onChange={onInputChanged} />}
        {timeframeType === '2' && <DateRangeSelector onChange={onInputChanged} />}
        {(userListMode === '2' || userListMode === '4') && <Button icon="fa fa-users" onClick={showGroupsPopup}
            title="Add users / groups to report" />}
    </>;
}, ({ userListMode, timeframeType }) => ({ userListMode, timeframeType }));

export default CustomActions;

const DateRangeSelector = connect(function ({ dateRange, onChange, setValue }) {
    const renderRef = useRef(true);
    const { current: isFirstRender } = renderRef;

    useEffect(() => {
        renderRef.current = false;
        !isFirstRender && onChange?.();
    }, [dateRange]); // eslint-disable-line react-hooks/exhaustive-deps


    return (<DatePicker value={dateRange} range={true}
        onChange={(val) => setValue('dateRange', val)} style={{ marginRight: '35px' }} />);
}, ({ dateRange }) => ({ dateRange }), { setValue });