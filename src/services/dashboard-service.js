import { DASHBOARD_ICONS } from "../constants/font-icons";
import { SettingsCategory } from "../constants/settings";

export default class DashboardService {
    static dependencies = ["SessionService", "SettingsService", "CacheService"];

    constructor($session, $settings, $cache) {
        this.$session = $session;
        this.$settings = $settings;
        this.$cache = $cache;
        this.updated = () => { /* Empty method, no need of implementation */ };
    }

    onChange(callback) {
        this.updated = callback;
    }

    getDashboards = () => this.$session.CurrentUser.dashboards;// this.$settings.getDashboards(this.$session.userId);

    saveDashboardInfo = async (index, dashboard, updateMenu) => {
        if (!dashboard) {
            console.error("Unable to save dashboard: ", index, dashboard, updateMenu);
            return null;
        }

        this.saveUserDashboards(dashboard, updateMenu !== true);
    };

    async saveUserDashboards(dashboard, avoidMenuUpdate) {
        if (!dashboard.id) {
            dashboard.id = new Date().getTime();
        }

        await this.saveBoard(dashboard);
        await this.updateSessionDashboards(avoidMenuUpdate);

        return dashboard;
    }

    saveBoard = (board) => this.$settings.saveSetting(this.$session.userId, SettingsCategory.Dashboard, board.id, board);

    async updateSessionDashboards(avoidMenuUpdate) {
        const dashboards = await this.$settings.getDashboards(this.$session.userId);//this.getDashboards();
        this.$session.CurrentUser.dashboards = dashboards;
        if (!avoidMenuUpdate) {
            this.updated(dashboards);
        }
    }

    async createDashboard() {
        const dashboards = this.$session.CurrentUser.dashboards;
        const count = dashboards.length;

        // If id does not exist, then default dashboard has never saved
        // Hence save it first before creating new dashboard.
        const defBoardToSave = count === 1 && dashboards[0];
        if (defBoardToSave && !defBoardToSave.id) {
            await this.saveUserDashboards(defBoardToSave, true);
            console.log('Default dashboard automatically saved');
        }

        const iconIdx = this.rand(0, DASHBOARD_ICONS.length - 1);
        const dashboard = {
            icon: DASHBOARD_ICONS[iconIdx],
            layout: 1,
            name: `New Dashboard ${count + 1}`,
            widgets: [],
            isQuickView: false
        };
        return this.saveUserDashboards(dashboard);
    }

    rand(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    async deleteDashboard(index) {
        const dashboard = this.$session.CurrentUser.dashboards[index];
        await this.$settings.deleteDashboard(this.$session.userId, dashboard.id);

        if (dashboard.isQuickView) {
            const firstBoard = this.$session.CurrentUser.dashboards[index ? 0 : 1];
            await this.setAsQuickView(firstBoard, 0);
        }

        await this.updateSessionDashboards();
    }

    getQuickViewBoardIndex() {
        const dashboards = this.$session.CurrentUser.dashboards;
        return dashboards.findIndex(d => d.isQuickView);
    }

    setQuickViewBoardIndex(index) {
        if ((index || index === 0) && index >= 0 && this.getQuickViewBoardIndex() !== index) {
            const board = this.$session.CurrentUser.dashboards[index];
            if (board) {
                this.setAsQuickView(board, index);
            }
        }
    }

    async setAsQuickView({ id }, index) {
        const dashboards = await this.$settings.getDashboards(this.$session.userId);
        const currentBoard = dashboards.filter(d => d.id === id)[0];
        const oldBoard = dashboards.filter(d => d.isQuickView)[0];

        currentBoard.isQuickView = true;

        if (oldBoard === currentBoard) { return currentBoard; }

        if (oldBoard) {
            oldBoard.isQuickView = false;
            await this.saveBoard(oldBoard);
        }

        await this.saveUserDashboards(currentBoard, true);

        let quickMenu = (await this.$settings.get("menuAction")) || this.$cache.get("menuAction", true);
        if (quickMenu) {
            if (typeof quickMenu === 'string') {
                quickMenu = JSON.parse(quickMenu);
            }

            if (quickMenu.action === 3) {
                if (index === 0) {
                    delete quickMenu.index;
                }
                else {
                    quickMenu.index = index;
                }
            }
            await this.$settings.set("menuAction", quickMenu);
        }

        return currentBoard;
    }

    getBoardWithId = (id) => this.$settings.getSetting(this.$session.userId, SettingsCategory.Dashboard, id);

    async setAsTabView({ id }, index) {
        const currentBoard = id ? await this.getBoardWithId(id) : this.$session.CurrentUser.dashboards[index];

        currentBoard.isTabView = !currentBoard.isTabView;

        this.$session.CurrentUser.dashboards[index].isTabView = currentBoard.isTabView;

        return this.saveUserDashboards(currentBoard, true);
    }
}