import BaseControl from './BaseControl';

class ProjectDisplay extends BaseControl {
    renderControl() {
        const { value, project = value } = this.props;

        if (!project) { return null; }

        return (typeof project === 'string') ? project : project.key;
    }
}

export default ProjectDisplay;