/* eslint-disable max-len */
// https://fa2png.app/
const playIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="16px" height="16px" fill="#36B37E">
<path d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"></path>
</svg>`;
export const icons = {
    start: `<div class="ja-icon ja-icon-start" data-tooltip="Jira Assist: Start time tracking">${playIconSvg}</div>`,
    resume: `<div class="ja-icon ja-icon-resume" data-tooltip="Jira Assist: Resume time tracking">${playIconSvg}</div>`,
    pause: `<div class="ja-icon ja-icon-pause" data-tooltip="Jira Assist: Pause time tracking">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="18px" height="18px" fill="#ffa500">
    <path d="M144 479H48c-26.5 0-48-21.5-48-48V79c0-26.5 21.5-48 48-48h96c26.5 0 48 21.5 48 48v352c0 26.5-21.5 48-48 48zm304-48V79c0-26.5-21.5-48-48-48h-96c-26.5 0-48 21.5-48 48v352c0 26.5 21.5 48 48 48h96c26.5 0 48-21.5 48-48z"></path>
    </svg></div>`,
    stop: `<div class="ja-icon ja-icon-stop" data-tooltip="Jira Assist: Stop time tracking and generate worklog">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="18px" height="18px" fill="#ff0000">
    <path d="M400 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48z"></path>
    </svg></div>`,
    close: `<div class="ja-icon ja-icon-close" title="Hide timer. You can change it from JA general settings">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512" width="18px" height="18px" fill="#df438f">
    <path d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"></path>
    </svg></div>`
};

export const curOrigin = document.location.origin;
export const isCloud = curOrigin.endsWith('.atlassian.net');

const cloudRegexSet = {
    board: /^\/jira\/software\/c\/projects\/([A-Z0-9-]+)\/boards\/(\d+)/gi,
    issue: /browse\/([A-Z0-9]+-\d+)[/?]?.*$/gi
};

// This has to be updated
const dsRegexSet = {
    board: /^.*\/secure\/RapidBoard\.jspa.*$/gi,
    issue: /browse\/([A-Z0-9]+-\d+)[/?]?.*$/gi
};

export const regexSet = isCloud ? cloudRegexSet : dsRegexSet;

export const Pages = {
    Board: 'board',
    Issue: 'issue'
};