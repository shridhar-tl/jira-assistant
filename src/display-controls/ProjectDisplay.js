import React from 'react';
import BaseControl from './BaseControl';

class ProjectDisplay extends BaseControl {
    renderControl() {
        const { value, project = value } = this.props;

        if (!project) { return null; }

        return (
            <span>{project.key} </span>
        );
    }
}

export default ProjectDisplay;