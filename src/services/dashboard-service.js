import { DASHBOARD_ICONS } from "../_constants";

export default class DashboardService {
    static dependencies = ["SessionService", "UserService", "CacheService"];

    constructor($session, $user, $cache) {
        this.$session = $session;
        this.$user = $user;
        this.$cache = $cache;
        this.updated = () => { /* Empty method, no need of implementation */ };
    }

    onChange(callback) {
        this.updated = callback;
    }

    getDashboards() {
        return this.$session.CurrentUser.dashboards;
    }

    async saveDashboardInfo(index, dashboard, updateMenu) {
        return await this.$user.getUser(this.$session.userId).then(u => {
            if (!u.dashboards) {
                u.dashboards = [this.currentBoard];
            }
            else {
                u.dashboards[index] = dashboard;
            }
            return this.saveUserDashboards(u, updateMenu !== true);
        });
    }

    async saveUserDashboards(u, avoidMenuUpdate) {
        return await this.$user.saveUser(u).then(uid => {
            this.$session.CurrentUser.dashboards = u.dashboards;
            if (!avoidMenuUpdate) {
                this.updated(u.dashboards);
            }
            return uid;
        });
    }

    async createDashboard() {
        return await this.$user.getUser(this.$session.userId).then(u => {
            u.dashboards = this.$session.CurrentUser.dashboards;
            if (!u.dashboards) {
                u.dashboards = [this.currentBoard];
            }
            const iconIdx = this.rand(0, DASHBOARD_ICONS.length - 1);
            u.dashboards.push({ icon: DASHBOARD_ICONS[iconIdx], layout: 1, name: `New Dashboard ${u.dashboards.length + 1}`, widgets: [], isQuickView: false });
            return this.saveUserDashboards(u);
        });
    }

    rand(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    deleteDashboard(index) {
        return this.$user.getUser(this.$session.userId).then(u => {
            const [removedBoard] = u.dashboards.splice(index, 1);
            if (removedBoard.isQuickView) {
                u.dashboards[0].isQuickView = true;
            }
            return this.saveUserDashboards(u);
        });
    }

    setAsQuickView(currentBoard, index) {
        currentBoard.isQuickView = true;
        this.$user.getUser(this.$session.userId).then(u => {
            if (!u.dashboards) {
                u.dashboards = [currentBoard];
            }
            else {
                u.dashboards.forEach((dboard, i) => dboard.isQuickView = i === index);
            }

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

            return this.saveUserDashboards(u, true);
        });
    }

    setAsTabView(currentBoard, index) {
        currentBoard.isTabView = !currentBoard.isTabView;
        this.$user.getUser(this.$session.userId).then(u => {
            if (!u.dashboards) {
                u.dashboards = [currentBoard];
            }
            else {
                u.dashboards[index].isTabView = currentBoard.isTabView;
            }

            return this.saveUserDashboards(u, true);
        });
    }
}