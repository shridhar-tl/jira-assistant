import { useEffect, useMemo, useState } from 'react';

import { Autocomplete, AutocompleteMulti } from '@components';

import { getAllBoards } from '../jira-api';
import type { PlannerBoard } from '../types';

interface SingleProps {
    multiple?: false;
    value: number | null;
    onChange: (board: PlannerBoard | null) => void;
}

interface MultipleProps {
    multiple: true;
    value: number[];
    onChange: (boards: PlannerBoard[]) => void;
}

type BoardPickerProps = (SingleProps | MultipleProps) & {
    scrumOnly?: boolean;
    placeholder?: string;
    className?: string;
};

const maxSuggestions = 50;
const typeLabels: Record<PlannerBoard['type'], string> = { scrum: 'Scrum', kanban: 'Kanban', simple: 'Team' };

export default function BoardPicker(props: BoardPickerProps) {
    const { scrumOnly, placeholder = 'Choose a board', className } = props;
    const [boards, setBoards] = useState<PlannerBoard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [query, setQuery] = useState('');

    useEffect(() => {
        let cancelled = false;
        getAllBoards()
            .then((list) => !cancelled && setBoards(list))
            .catch((err) => console.error('Unable to load the boards', err))
            .finally(() => !cancelled && setIsLoading(false));
        return () => {
            cancelled = true;
        };
    }, []);

    const available = useMemo(() => (scrumOnly ? boards.filter((b) => b.type !== 'kanban') : boards), [boards, scrumOnly]);
    const selected = !props.multiple ? available.find((b) => b.id === props.value) || null : null;

    useEffect(() => {
        if (!props.multiple) {
            setQuery(selected?.name || '');
        }
    }, [selected?.id, selected?.name, props.multiple]);

    if (props.multiple) {
        const { value, onChange } = props;
        return (
            <div className={className}>
                <AutocompleteMulti
                    items={available.map((b) => ({ label: `${b.name} (${typeLabels[b.type]})`, value: b.id }))}
                    value={value}
                    onChange={(e) => onChange(available.filter((b) => (e.value as number[]).includes(b.id)))}
                    placeholder={placeholder}
                    readonly={isLoading}
                />
            </div>
        );
    }

    const { onChange } = props;
    const search = query.trim().toLowerCase();
    const showAll = !search || query === selected?.name;
    const items = (showAll ? available : available.filter((b) => b.name.toLowerCase().includes(search) || String(b.id).startsWith(search)))
        .slice(0, maxSuggestions)
        .map((b) => ({ label: `${b.name} (${typeLabels[b.type]})`, value: b.id }));

    return (
        <div className={className}>
            <Autocomplete
                items={items}
                value={query}
                selectedValue={selected?.id}
                onChange={(e) => {
                    setQuery(e.value);
                    if (!e.value) {
                        onChange(null);
                    }
                }}
                onSelect={(e) => onChange(available.find((b) => b.id === e.value) || null)}
                minLength={0}
                placeholder={placeholder}
                readonly={isLoading}
                emptyMessage="No matching boards"
            />
        </div>
    );
}
