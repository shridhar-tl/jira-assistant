/* eslint-disable array-bracket-newline */
const { app, Menu } = require('electron');

const isMac = process.platform === 'darwin';

module.exports = function (window, basePath) {
    const template = [
        // { role: 'appMenu' }
        ...(isMac ? [{
            label: app.name,
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        }] : []),

        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Activities',
            submenu: [
                getMenu('Worklog calendar', '/calendar'),
                getMenu('Import worklog', '/import/worklog'),
                getMenu('Import issue', '/import/issue')
            ]
        },
        {
            label: 'Reports',
            submenu: [
                getMenu('Worklog report', '/reports/userdaywise'),
                getMenu('Sprint report', '/reports/sprint'),
                getMenu('Custom report', '/reports/custom'),
                getMenu('Estimate vs Actual', '/reports/estimateactual')
            ]
        },
        // { role: 'windowMenu' }
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                isMac ? { role: 'close' } : { role: 'quit' }
            ]
        },
        {
            role: 'help',
            submenu: [
                getExternalMenu('Learn More', 'https://www.jiraassistant.com'),
                getExternalMenu('FAQ\'s', 'https://www.jiraassistant.com/faq'),
                getExternalMenu('Contact us', 'https://www.jiraassistant.com/contact-us'),
                getExternalMenu('Version History', 'https://www.jiraassistant.com/version-history#latest-updates'),
                getExternalMenu('Issue tracker', 'https://github.com/shridhar-tl/jira-assistant/issues'),
                getExternalMenu('Launch Web', 'https://app.jiraassistant.com'),
                getExternalMenu('Donate', 'https://www.jiraassistant.com/donate'),
                getAboutMenu()
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    function getMenu(label, path) {
        return {
            label, click: () => {
                const userId = 5; // TodDo:
                window.loadURL(`${basePath}#/${userId}${path}`);
            }
        };
    }

    function getExternalMenu(label, url) {
        return {
            label,
            click: async () => {
                const { shell } = require('electron');
                await shell.openExternal(url);
            }
        };
    }

    function getAboutMenu() {
        return {
            label: 'About',
            click: () => {
                const openAboutWindow = require('electron-about-window');
                //const { app } = require('electron');

                openAboutWindow({
                    icon_path: '',
                    product_name: 'Jira Assistant v2.41',
                    //package_json_dir: '',
                    //about_page_dir: '',
                    bug_report_url: 'https://www.jiraassistant.com/contact-us',
                    bug_link_text: 'Contact us',
                    copyright: 'Copyright (c) 2016-2022 Jira Assistant',
                    homepage: 'https://www.jiraassistant.com',
                    description: '',
                    //license: '',
                    //css_path: '',
                    //adjust_window_size: '',
                    //win_options?: BrowserWindowOptions;
                    use_version_info: 'v2.41',
                    show_close_button: 'Exit',
                    //app
                });
            }
        };
    }
};