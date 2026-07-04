import './Style.css';

interface IndicatorProps {
    value: number;
    maxHours: number;
}

function WorklogIndicator({ value, maxHours }: IndicatorProps) {
    let perc = -100;
    let className = 'log-indicator';

    if (value) {
        perc = (value * 100) / maxHours;
        if (perc > 100) {
            perc = 100;
        } else if (perc < 0) {
            perc = 0;
        }
        perc = perc - 100;
    } else {
        className += ' no-value';
    }

    return (
        <div className={className}>
            <div className="prog-bar" style={{ marginLeft: `${perc}%` }} />
        </div>
    );
}

export default WorklogIndicator;
