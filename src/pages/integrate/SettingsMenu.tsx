import { useEffect, useRef, useState } from 'react';

const settingsMenuItems = [
    { label: 'Import Settings', icon: 'fa fa-upload' },
    { label: 'Options', icon: 'fa fa-cogs' },
    { separator: true },
    { label: 'Use Jira OAuth', icon: 'fa fa-external-link' },
    { label: 'Use Basic Auth', icon: 'fa fa-user' },
] as const;

function SettingsMenu({ onItemClick }: { onItemClick: (index: number) => void }) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    return (
        <div className="relative" ref={menuRef}>
            <button
                className="text-blue-600 hover:text-blue-800 text-lg cursor-pointer p-1 transition-colors"
                onClick={() => setOpen(!open)}
                title="Click to show more options"
            >
                <i className="fa fa-cogs" />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 z-20 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg shadow-[var(--shadow-lg)] py-1 min-w-[200px]">
                    {settingsMenuItems.map((item, index) =>
                        'separator' in item ? (
                            <hr key={index} className="my-1 border-[var(--border-primary)]" />
                        ) : (
                            <button
                                key={index}
                                className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 cursor-pointer"
                                onClick={() => {
                                    onItemClick(index);
                                    setOpen(false);
                                }}
                            >
                                <i className={`${item.icon} w-4 text-center`} />
                                {item.label}
                            </button>
                        ),
                    )}
                </div>
            )}
        </div>
    );
}

export default SettingsMenu;
