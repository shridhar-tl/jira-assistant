import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';

interface MenuItem {
    label: string;
    icon?: string;
    command?: () => void;
    disabled?: boolean;
    items?: MenuItem[];
    separator?: boolean;
}

interface ContextMenuContextType {
    show: (event: React.MouseEvent, items: MenuItem[]) => void;
    hide: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextType | null>(null);

export function useContextMenu() {
    const context = useContext(ContextMenuContext);
    if (!context) {
        throw new Error('useContextMenu must be used within ContextMenuProvider');
    }
    return context;
}

export function ContextMenuProvider({ children }: { children: ReactNode }) {
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [items, setItems] = useState<MenuItem[]>([]);
    const menuRef = useRef<HTMLDivElement>(null);

    const show = (event: React.MouseEvent, menuItems: MenuItem[]) => {
        event.preventDefault();
        event.stopPropagation();

        setItems(menuItems);

        const x = event.clientX;
        const y = event.clientY;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        setPosition({
            x: Math.min(x, viewportWidth - 220),
            y: Math.min(y, viewportHeight - 200),
        });
        setVisible(true);
    };

    const hide = () => {
        setVisible(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                hide();
            }
        };

        if (visible) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [visible]);

    return (
        <ContextMenuContext.Provider value={{ show, hide }}>
            {children}
            {visible && (
                <div
                    ref={menuRef}
                    className="fixed z-9999 bg-(--bg-primary) border border-(--border-primary) rounded-lg py-1 min-w-50 shadow-(--shadow-lg)"
                    style={{ left: position.x, top: position.y }}
                >
                    {items.map((item, index) =>
                        item.separator ? (
                            <div key={index} className="border-t border-(--border-secondary) my-1" />
                        ) : (
                            <button
                                key={index}
                                onClick={() => {
                                    if (!item.disabled && item.command) {
                                        item.command();
                                        hide();
                                    }
                                }}
                                disabled={item.disabled}
                                className="w-full px-3 py-1.5 text-left text-[13px] hover:bg-(--bg-hover) disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-primary"
                            >
                                {item.icon && <span className={item.icon} />}
                                {item.label}
                            </button>
                        ),
                    )}
                </div>
            )}
        </ContextMenuContext.Provider>
    );
}
