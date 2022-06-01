import { DASHBOARD_ICONS, SettingsCategory } from "../_constants";

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
        const iconIdx = this.rand(0, DASHBOARD_ICONS.length - 1);
        const dashboard = {
            icon: DASHBOARD_ICONS[iconIdx],
            layout: 1,
            name: `New Dashboard ${dashboards.length + 1}`,
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
            this.setAsQuickView(firstBoard, 0);
        } else {
            await this.updateSessionDashboards();
        }
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

        let quickMenu = this.$cache.get("menuAction", true);
        if (quickMenu) {
            quickMenu = JSON.parse(quickMenu);
            if (quickMenu.action === 3) {
                if (index === 0) {
                    delete quickMenu.index;
                }
                else {
                    quickMenu.index = index;
                }
            }
            this.$cache.set("menuAction", quickMenu, false, true);
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