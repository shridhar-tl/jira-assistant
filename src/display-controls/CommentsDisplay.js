import BaseControl from './BaseControl';

class CommentsDisplay extends BaseControl {
    renderControl() {
        let { value } = this.props;

        if (typeof value?.maxResults === 'number') {
            return `${value.maxResults} comments`;
        } else if (Array.isArray(value?.comments)) {
            value = value.comments;
        }

        if (!value?.length) { return null; }

        return `${value.length} comments`;
    }
}

export default CommentsDisplay;