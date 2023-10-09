import React from 'react';
import moment from 'moment';
import { getWeekGroup, getDateRange } from 'src/utils/date';
import { create } from 'zustand';

export const GanttContext = React.createContext({});
export const PropsProvider = GanttContext.Provider;

export const useGanttProps = create(getInitialProperties);

function getInitialProperties() {
    return {
        fromDate: moment().add(-10, 'days').toDate(),
        toDate: moment().add(30, 'days').toDate(),
        dateRange: [],
        weekHeader: []
    };
}

export function initStoreWithProps(fromDate, toDate, isHoliday) {
    const dateRange = getDateRange(fromDate, toDate, isHoliday);
    const weekHeader = getWeekGroup(dateRange);

    useGanttProps.setState({ fromDate, toDate, dateRange, weekHeader });
}
