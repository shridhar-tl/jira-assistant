import React, { PureComponent } from 'react';

class ProjectDisplay extends PureComponent {
    render() {
        const { tag: Tag = "span", className, value, project = value } = this.props;

        if (!project) { return null; }

        return (
            <Tag className={className}>{project.key} </Tag>
        );
    }
}

export default ProjectDisplay;