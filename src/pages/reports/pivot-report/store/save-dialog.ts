import { create } from 'zustand';

interface SaveDialogState {
    isOpen: boolean;
}

export const useSaveDialog = create<SaveDialogState>(() => ({ isOpen: false }));

export function openSaveDialog() {
    useSaveDialog.setState({ isOpen: true });
}

export function closeSaveDialog() {
    useSaveDialog.setState({ isOpen: false });
}
