import './DayColumn.css';

interface DayColumnValue {
    prop?: string;
    isHoliday?: boolean;
    dateNum?: number | string;
    day?: string;
}

interface DayColumnProps {
    value?: DayColumnValue;
    tagProps?: React.ThHTMLAttributes<HTMLTableCellElement>;
}

function DayColumn({ value, tagProps = {} }: DayColumnProps) {
    if (!value) {
        return null;
    }

    return (
        <th data-test-id={value.prop} className={`day-head${value.isHoliday ? ' holiday' : ''}`} {...tagProps}>
            {value.dateNum}
            <br />
            <span className="day-name">{value.day}</span>
        </th>
    );
}

export default DayColumn;
