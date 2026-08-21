import { createContext } from 'react';

export const AppContext = createContext({});
export const AppContextProvider = AppContext.Provider;

// WorklogContext was removed: its provider was never mounted, so consumers silently
// received an empty object. Timer state lives in stores/worklog-store (zustand) instead.
