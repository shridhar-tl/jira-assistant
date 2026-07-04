import DateRangeFieldOptions from './DateRangeFieldOptions';
import DisplayOption from './DefaultOptions';

const displayOptionComponent: Record<string, any> = {
    any: DisplayOption,
    'date-range': DateRangeFieldOptions,
};

export default displayOptionComponent;
