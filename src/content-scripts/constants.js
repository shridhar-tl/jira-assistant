// https://fa2png.app/
const playIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="18px" height="18px" fill="#00ff00">
<path d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"></path>
</svg>`;
export const icons = {
    start: `<div data-tooltip="Jira Assist: Start time tracking">${playIconSvg}</div>`,
    resume: `<div data-tooltip="Jira Assist: Resume time tracking">${playIconSvg}</div>`,
    pause: `<div data-tooltip="Jira Assist: Pause time tracking">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="18px" height="18px" fill="#ffa500">
    <path d="M144 479H48c-26.5 0-48-21.5-48-48V79c0-26.5 21.5-48 48-48h96c26.5 0 48 21.5 48 48v352c0 26.5-21.5 48-48 48zm304-48V79c0-26.5-21.5-48-48-48h-96c-26.5 0-48 21.5-48 48v352c0 26.5 21.5 48 48 48h96c26.5 0 48-21.5 48-48z"></path>
    </svg></div>`,
    stop: `<div data-tooltip="Jira Assist: Stop time tracking and generate worklog">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="18px" height="18px" fill="#ff0000">
    <path d="M400 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48z"></path>
    </svg></div>`
};

export const regexSet = {
    cloudBoard: /^\/jira\/software\/c\/projects\/([A-Z0-9-]+)\/boards\/(\d+)/gi
};

export const Pages = {
    Board: 'board',
    Issue: 'issue'
};