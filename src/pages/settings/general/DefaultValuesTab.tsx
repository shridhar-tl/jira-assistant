import { useEffect, useState } from 'react';

import { inject } from '@services';

import { AutocompleteMulti, Dropdown } from '@components';

interface DefaultValuesTabProps {
    settings: Record<string, any>;
    onSave: (value: any, field: string) => void;
}

interface Project {
    name: string;
    id: number;
    key: string;
}

interface RapidView {
    name: string;
    id: number;
}

interface CustomField {
    id: string;
    name: string;
    clauseNames: string[];
}

export default function DefaultValuesTab({ settings, onSave }: DefaultValuesTabProps) {
    const { $jira } = inject('JiraService');

    const [rapidViews, setRapidViews] = useState<RapidView[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [numericFields, setNumericFields] = useState<CustomField[]>([]);
    const [stringFields, setStringFields] = useState<CustomField[]>([]);
    const [filteredRapidViews, setFilteredRapidViews] = useState<RapidView[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);

    useEffect(() => {
        loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadData = async () => {
        try {
            const rapidViewsData = await $jira.getRapidViews();
            const sortedRapidViews = rapidViewsData
                .sort((a: RapidView, b: RapidView) => a.name.localeCompare(b.name))
                .map((d: any) => ({ name: d.name, id: d.id }));
            setRapidViews(sortedRapidViews);
            setFilteredRapidViews(sortedRapidViews);

            const projectsData = await $jira.getProjects();
            const sortedProjects = projectsData
                .map(({ name, id, key }: any) => ({ name, id, key }))
                .sort((a: Project, b: Project) => a.name.localeCompare(b.name));
            setProjects(sortedProjects);
            setFilteredProjects(sortedProjects);

            const cfList = await $jira.getCustomFields();
            const numericCf = cfList
                .filter((cf: any) => cf.custom && cf.schema.type === 'number')
                .map((cf: any) => ({ id: cf.id, name: cf.name, clauseNames: cf.clauseNames }))
                .sort((a: CustomField, b: CustomField) => a.name.localeCompare(b.name));

            const stringCf = cfList
                .filter((cf: any) => cf.custom && (cf.schema.type === 'any' || cf.schema.type === 'string'))
                .map((cf: any) => ({ id: cf.id, name: cf.name, clauseNames: cf.clauseNames }))
                .sort((a: CustomField, b: CustomField) => a.name.localeCompare(b.name));

            setNumericFields(numericCf);
            setStringFields(stringCf);
            setDefaultValues(numericCf, stringCf);
        } catch (error) {
            console.error('Error loading default values data:', error);
        }
    };

    const setDefaultValues = (numericCf: CustomField[], stringCf: CustomField[]) => {
        const { storyPointField, epicNameField } = settings;

        if (!storyPointField) {
            let spF = numericCf.find((cf) => cf.name.toLowerCase() === 'story points');
            if (!spF) {
                spF = numericCf.find((cf) => {
                    const name = cf.name.toLowerCase();
                    return name.indexOf('story') > -1 && name.indexOf('points') > -1;
                });
            }
            if (spF) {
                onSave(spF, 'storyPointField');
            }
        }

        if (!epicNameField) {
            let enF = stringCf.find((cf) => cf.name.toLowerCase() === 'epic link');
            if (!enF) {
                enF = stringCf.find((cf) => {
                    const name = cf.name.toLowerCase();
                    return name.indexOf('epic') > -1 && name.indexOf('link') > -1;
                });
            }
            if (enF) {
                onSave(enF, 'epicNameField');
            }
        }
    };

    const filterRapidViews = (query: string) => {
        const lowerQuery = (query || '').toLowerCase();
        const selected: RapidView[] = settings.rapidViews || [];
        setFilteredRapidViews(
            rapidViews.filter(
                (r) =>
                    (r.name.toLowerCase().indexOf(lowerQuery) >= 0 || r.id.toString().startsWith(query)) &&
                    !selected.some((v) => v.id === r.id),
            ),
        );
    };

    const filterProjects = (query: string) => {
        const lowerQuery = (query || '').toLowerCase();
        const selected: Project[] = settings.projects || [];
        setFilteredProjects(
            projects.filter(
                (r) =>
                    (r.name.toLowerCase().indexOf(lowerQuery) >= 0 ||
                        r.key.toLowerCase().startsWith(lowerQuery) ||
                        r.id.toString().startsWith(query)) &&
                    !selected.some((v) => v.id === r.id),
            ),
        );
    };

    return (
        <div className="divide-y divide-[--border-primary]">
            <div className="pb-5">
                <div className="text-sm font-semibold text-[--text-primary] mb-1">Projects</div>
                <p className="text-xs text-[--text-secondary] mb-3">Select the Jira projects you work with most frequently</p>
                <AutocompleteMulti
                    value={settings.projects || []}
                    items={filteredProjects.map((p) => ({ value: p, label: p.name }))}
                    onFilter={filterProjects}
                    onChange={(e) => onSave(e.value, 'projects')}
                    placeholder="Start typing a project name..."
                    className="w-full max-w-sm"
                    disabled={projects.length === 0}
                />
            </div>

            <div className="py-5">
                <div className="text-sm font-semibold text-[--text-primary] mb-1">Agile Boards</div>
                <p className="text-xs text-[--text-secondary] mb-3">Select the Agile boards you want quick access to</p>
                <AutocompleteMulti
                    value={settings.rapidViews || []}
                    items={filteredRapidViews.map((r) => ({ value: r, label: r.name }))}
                    onFilter={filterRapidViews}
                    onChange={(e) => onSave(e.value, 'rapidViews')}
                    placeholder="Start typing a board name..."
                    className="w-full max-w-sm"
                    disabled={rapidViews.length === 0}
                />
            </div>

            <div className="py-5">
                <div className="text-sm font-semibold text-[--text-primary] mb-1">Story Points Field</div>
                <p className="text-xs text-[--text-secondary] mb-3">Map the custom field used for story points in your Jira instance</p>
                <Dropdown
                    options={numericFields.map((f) => ({ value: f.id, label: f.name }))}
                    value={settings.storyPointField?.id}
                    onChange={(e) => onSave(numericFields.find((f) => f.id === e.value), 'storyPointField')}
                    className="w-64"
                    placeholder="Select story points field"
                    disabled={numericFields.length === 0}
                    searchable
                />
            </div>

            <div className="pt-5">
                <div className="text-sm font-semibold text-[--text-primary] mb-1">Epic Name Field</div>
                <p className="text-xs text-[--text-secondary] mb-3">Map the custom field used for epic names in your Jira instance</p>
                <Dropdown
                    options={stringFields.map((f) => ({ value: f.id, label: f.name }))}
                    value={settings.epicNameField?.id}
                    onChange={(e) => onSave(stringFields.find((f) => f.id === e.value), 'epicNameField')}
                    className="w-64"
                    placeholder="Select epic name field"
                    disabled={stringFields.length === 0}
                    searchable
                />
            </div>
        </div>
    );
}
