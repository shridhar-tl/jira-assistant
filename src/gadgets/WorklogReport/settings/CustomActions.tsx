import { memo, useCallback, useEffect, useRef, useMemo } from 'react';

import type { DateSelectedCallbackArg } from '@components';
import { Button } from '@components';

import DateRangePicker from '../../../controls/DateRangePicker';

import { useWorklogStore, useWorklogDispatch } from '../datastore';

import ChooseBoard from './ChooseBoard';

interface CustomActionsProps {
    onInputChanged: () => void;
    showGroupsPopup: () => void;
}

function CustomActions({ onInputChanged, showGroupsPopup }: CustomActionsProps) {
    const { userListMode, timeframeType, dateRange } = useWorklogStore();
    const dispatch = useWorklogDispatch();

    const showUserBtn = userListMode === '2' || userListMode === '4';

    const handleChange = useCallback(
        (e: DateSelectedCallbackArg) => {
            const [fromDate, toDate] = e.value;
            dispatch({ dateRange: { fromDate, toDate } });
        },
        [dispatch],
    );

    const dateRangeValue = useMemo<[Date, Date] | undefined>(() => {
        const { fromDate, toDate } = dateRange || {};
        if (!fromDate || !toDate) {
            return undefined;
        }
        return [fromDate instanceof Date ? fromDate : new Date(fromDate), toDate instanceof Date ? toDate : new Date(toDate)];
    }, [dateRange]);

    return (
        <>
            {timeframeType === '1' && <ChooseBoard onChange={onInputChanged} />}
            {timeframeType === '2' && <DateRangeSelector value={dateRangeValue} onChange={handleChange} onInputChanged={onInputChanged} />}
            {showUserBtn && (
                <Button
                    layout="plain"
                    leftIcon={<i className="fa fa-users" />}
                    onClick={showGroupsPopup}
                    title="Add users / groups to report"
                    size="sm"
                />
            )}
        </>
    );
}

export default memo(CustomActions);

interface DateRangeSelectorProps {
    value: [Date, Date] | undefined;
    onChange: (e: DateSelectedCallbackArg) => void;
    onInputChanged: () => void;
}

function DateRangeSelector({ value, onChange, onInputChanged }: DateRangeSelectorProps) {
    const isFirstRender = useRef(true);
    const onInputChangedRef = useRef(onInputChanged);

    useEffect(() => {
        onInputChangedRef.current = onInputChanged;
    }, [onInputChanged]);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        onInputChangedRef.current();
    }, [value]);

    return <DateRangePicker value={value} onChange={onChange} />;
}
