import React from 'react';
import { Image } from '../controls';
import BaseControl from './BaseControl';

class ProjectDisplay extends BaseControl {
    renderControl(badge) {
        const { value, project = value, settings } = this.props;

        if (!project) { return badge; }

        if (typeof project === 'string') {
            return project;
        }

        const iconUrl = project.avatarUrls?.['16x16'];
        const valueType = settings?.valueType;

        let disp = project.key;

        if (valueType === 'name') {
            disp = project.name;
        }
        else if (valueType === 'both') {
            disp = (<>{project.name} ({project.key})</>);
        }

        return (<>{!!iconUrl && <Image src={iconUrl} />}{disp}{badge}</>);
    }
}

export default ProjectDisplay;