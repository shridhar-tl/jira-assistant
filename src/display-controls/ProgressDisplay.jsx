import BaseControl from './BaseControl';

class ProgressDisplay extends BaseControl {
    renderControl() {
        const { value, progress = value } = this.props;

        if (!progress?.percent) { return null; }

        return `${progress.percent}%`;
    }
}

export default ProgressDisplay;