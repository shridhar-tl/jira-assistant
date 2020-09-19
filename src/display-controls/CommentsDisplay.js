import BaseControl from './BaseControl';

class CommentsDisplay extends BaseControl {
    renderControl() {
        const { value } = this.props;

        if (!value?.length) { return null; }

        return `${value.length} comments`;
    }
}

export default CommentsDisplay;