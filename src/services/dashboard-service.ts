import { SettingsCategory } from '@/constants';

import type CacheService from './cache-service';
import type SessionService from './session-service';
import type SettingsService from './settings-service';

const DASHBOARD_ICONS = [
    'fa fa-dashboard',
    'fa fa-tachometer',
    'fa fa-chart-line',
    'fa fa-chart-bar',
    'fa fa-chart-pie',
    'fa fa-trophy',
    'fa fa-star',
    'fa fa-rocket',
    'fa fa-fire',
    'fa fa-bolt',
];

export default class DashboardService {
    static dependencies = ['SessionService', 'SettingsService', 'CacheService'];

    private $session: SessionService;
    private $settings: SettingsService;
    private $cache: CacheService;
    private updated: (dashboards: any[]) => void;

    constructor($session: SessionService, $settings: SettingsService, $cache: CacheService) {
        this.$session = $session;
        this.$settings = $settings;
        this.$cache = $cache;
        this.updated = () => {};
    }

    onChange(callback: (dashboards: any[]) => void): void {
        this.updated = callback;
    }

    getDashboards = (): any[] => this.$session.CurrentUser.dashboards || [];

    saveDashboardInfo = async (index: number, dashboard: any, updateMenu?: boolean): Promise<any> => {
        if (!dashboard) {
            console.error('Unable to save dashboard: ', index, dashboard, updateMenu);
            return null;
        }

        return this.saveUserDashboards(dashboard, updateMenu !== true);
    };

    async saveUserDashboards(dashboard: any, avoidMenuUpdate?: boolean): Promise<any> {
        if (!dashboard.id) {
            dashboard.id = new Date().getTime();
        }

        await this.saveBoard(dashboard);
        await this.updateSessionDashboards(avoidMenuUpdate);

        return dashboard;
    }

    saveBoard = (board: any): Promise<void> => {
        if (!this.$session.userId) {
            return Promise.reject(new Error('No user ID available'));
        }
        return this.$settings.saveSetting(this.$session.userId, SettingsCategory.Dashboard as any, board.id, board);
    };

    async updateSessionDashboards(avoidMenuUpdate?: boolean): Promise<void> {
        if (!this.$session.userId) {
            return;
        }
        const dashboards = await this.$settings.getDashboards(this.$session.userId);
        this.$session.CurrentUser.dashboards = dashboards;
        if (!avoidMenuUpdate) {
            this.updated(dashboards);
        }
    }

    async createDashboard(): Promise<any> {
        const dashboards = this.$session.CurrentUser.dashboards || [];
        const count = dashboards.length;

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
            isQuickView: false,
        };
        return this.saveUserDashboards(dashboard);
    }

    rand(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    async deleteDashboard(index: number): Promise<void> {
        if (!this.$session.userId) {
            return;
        }
        const dashboards = this.$session.CurrentUser.dashboards || [];
        const dashboard = dashboards[index];
        if (!dashboard) {
            return;
        }
        await this.$settings.deleteDashboard(this.$session.userId, dashboard.id);

        if (dashboard.isQuickView) {
            const firstBoard = dashboards[index ? 0 : 1];
            await this.setAsQuickView(firstBoard, 0);
        }

        await this.updateSessionDashboards();
    }

    getQuickViewBoardIndex(): number {
        const dashboards = this.$session.CurrentUser.dashboards || [];
        return dashboards.findIndex((d: any) => d.isQuickView);
    }

    setQuickViewBoardIndex(index: number): void {
        const dashboards = this.$session.CurrentUser.dashboards || [];
        if ((index || index === 0) && index >= 0 && this.getQuickViewBoardIndex() !== index) {
            const board = dashboards[index];
            if (board) {
                this.setAsQuickView(board, index);
            }
        }
    }

    async setAsQuickView({ id }: any, index: number): Promise<any> {
        if (!this.$session.userId) {
            return Promise.reject(new Error('No user ID available'));
        }
        const dashboards = await this.$settings.getDashboards(this.$session.userId);
        const currentBoard = dashboards.filter((d: any) => d.id === id)[0];
        const oldBoard = dashboards.filter((d: any) => d.isQuickView)[0];

        currentBoard.isQuickView = true;

        if (oldBoard === currentBoard) {
            return currentBoard;
        }

        if (oldBoard) {
            oldBoard.isQuickView = false;
            await this.saveBoard(oldBoard);
        }

        await this.saveUserDashboards(currentBoard, true);

        let quickMenu = (await this.$settings.get('menuAction')) || this.$cache.get('menuAction', true);
        if (quickMenu) {
            if (typeof quickMenu === 'string') {
                quickMenu = JSON.parse(quickMenu);
            }

            if (quickMenu.action === 3) {
                if (index === 0) {
                    delete quickMenu.index;
                } else {
                    quickMenu.index = index;
                }
            }
            await this.$settings.set('menuAction', quickMenu);
        }

        return currentBoard;
    }

    getBoardWithId = (id: string): Promise<any> => {
        if (!this.$session.userId) {
            return Promise.reject(new Error('No user ID available'));
        }
        return this.$settings.getSetting(this.$session.userId, SettingsCategory.Dashboard as any, id);
    };

    async setAsTabView({ id }: any, index: number): Promise<any> {
        const dashboards = this.$session.CurrentUser.dashboards || [];
        const currentBoard = id ? await this.getBoardWithId(id) : dashboards[index];

        if (!currentBoard) {
            return Promise.reject(new Error('Board not found'));
        }

        currentBoard.isTabView = !currentBoard.isTabView;

        if (dashboards[index]) {
            dashboards[index].isTabView = currentBoard.isTabView;
        }

        return this.saveUserDashboards(currentBoard, true);
    }
}
