import { TextInput } from '@components';

interface ExpressionInputProps {
    id: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function ExpressionInput({ id, value, onChange, placeholder }: ExpressionInputProps) {
    return (
        <TextInput
            id={id}
            value={value}
            onChange={(e) => onChange(e.value)}
            placeholder={placeholder}
            className="font-mono"
            autoComplete="off"
            spellCheck={false}
        />
    );
}
