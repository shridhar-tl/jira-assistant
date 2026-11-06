interface GadgetLoadingTextProps {
    text: string;
}

export default function GadgetLoadingText({ text }: GadgetLoadingTextProps) {
    return <span className="rounded-md bg-black/50 px-3 py-1 text-center text-sm font-medium text-white">{text}</span>;
}
