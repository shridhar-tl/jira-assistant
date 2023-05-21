import { updateTaskbar } from "./taskbar-edited";

export function taskBarEdited(setState, getState) {
    return function (event) {
        if (!event) {
            return;
        }

        const newState = updateTaskbar(event, getState());
        if (newState) {
            setState(newState);
        }
    };
}