import { type ElementType } from 'react';

import { Image } from '@/controls';

import BaseControl from './BaseControl';

interface Project {
    key: string;
    name: string;
    avatarUrls?: { '16x16'?: string };
}

interface ProjectDisplayProps {
    value?: Project | string;
    project?: Project | string;
    settings?: {
        valueType?: 'key' | 'name' | 'both';
        [key: string]: any;
    };
    tag?: ElementType | null;
    className?: string;
    [key: string]: any;
}

function ProjectDisplay({ value, project = value, settings, tag, className, ...rest }: ProjectDisplayProps) {
    if (!project) return <BaseControl tag={tag} className={className} {...rest} />;

    if (typeof project === 'string') {
        return (
            <BaseControl tag={tag} className={className} {...rest}>
                {project}
            </BaseControl>
        );
    }

    const iconUrl = project.avatarUrls?.['16x16'];
    const valueType = settings?.valueType;

    let disp: React.ReactNode = project.key;

    if (valueType === 'name') {
        disp = project.name;
    } else if (valueType === 'both') {
        disp = (
            <>
                {project.name} ({project.key})
            </>
        );
    }

    return (
        <BaseControl tag={tag} className={className} {...rest}>
            {!!iconUrl && <Image className="mr-2" src={iconUrl} />}
            {disp}
        </BaseControl>
    );
}

export default ProjectDisplay;
