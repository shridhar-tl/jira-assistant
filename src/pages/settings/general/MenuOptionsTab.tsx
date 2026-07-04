import { useEffect, useRef, useState } from 'react';

import { inject } from '@services';

import { Checkbox, Dropdown, ListBox, RadioButton } from '@components';

import { navigation } from '@constants/navigation';

interface MenuOption {
    id: string;
    name: string;
    icon?: string;
    url?: string;
    isHead?: boolean;
    selected?: boolean;
}

interface LaunchMenuItem {
    value: string;
    label: string;
    icon?: string;
}

interface LaunchMenuGroup {
    label: string;
    items: LaunchMenuItem[];
}

interface MenuOptionsTabProps {
    settings: Record<string, any>;
    onSave: (value: any, field: string) => void;
}

export default function MenuOptionsTab({ settings, onSave }: MenuOptionsTabProps) {
    const { $dashboard, $settings } = inject('DashboardService', 'SettingsService');

    const [menuAction, setMenuAction] = useState<number>(1);
    const [selectedLaunchPage, setSelectedLaunchPage] = useState<string>('');
    const [selectedDashboard, setSelectedDashboard] = useState<string>('');
    const [selectedMenu, setSelectedMenu] = useState<string[]>([]);
    const [menus, setMenus] = useState<MenuOption[]>([]);
    const [launchMenus, setLaunchMenus] = useState<LaunchMenuGroup[]>([]);
    const [dashboardMenus, setDashboardMenus] = useState<LaunchMenuItem[]>([]);

    // Keep a mutable ref copy to allow in-place mutation before setState
    const menusRef = useRef<MenuOption[]>([]);

    const fillMenus = (launchAction: Record<string, any>) => {
        const menusList: MenuOption[] = [];
        const selMenus = launchAction.selectedMenu || ['D-0', 'R-WL', 'R-SP', 'R-CG', 'CAL', 'S-GE'];

        const dashboards = $dashboard.getDashboards();
        const dashboardMenusList: LaunchMenuItem[] = [];
        dashboards.forEach((d: any, i: number) => {
            const id = `D-${i}`;
            const url = `/dashboard/${i}`;
            menusList.push({ id, name: d.name, icon: d.icon, url, selected: selMenus.indexOf(id) > -1 });
            dashboardMenusList.push({ value: id, label: d.name, icon: d.icon });
        });

        const launchMenusList: LaunchMenuGroup[] = navigation.map((group: any) => {
            const { id, name } = group;
            const mnuObj: MenuOption = { id, name, isHead: true };
            if (group.isDashboard) {
                menusList.splice(0, 0, mnuObj);
            } else {
                menusList.push(mnuObj);
            }

            const items = group.isDashboard
                ? dashboardMenusList
                : group.items.map((menu: any) => {
                      menusList.push({
                          id: menu.id,
                          isHead: menu.title,
                          name: menu.name,
                          icon: menu.icon,
                          url: menu.url,
                          selected: selMenus.indexOf(menu.id) > -1,
                      });

                      return { value: menu.id, label: menu.name, icon: menu.icon };
                  });

            return { label: name, items };
        });

        menusRef.current = menusList;
        setMenus(menusList);
        setLaunchMenus(launchMenusList);
        setDashboardMenus(dashboardMenusList);
    };

    useEffect(() => {
        const launchAction = settings.launchAction ? { ...settings.launchAction } : {};

        const idx = $dashboard.getQuickViewBoardIndex();
        launchAction.quickIndex = `D-${idx}`;

        const { action, autoLaunch, quickIndex } = launchAction;

        setMenuAction(action || 1);
        setSelectedLaunchPage(autoLaunch || '');
        setSelectedDashboard(quickIndex || `D-${idx}`);

        fillMenus(launchAction);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const doSaveSettings = (currentMenuAction: number, currentSelectedMenu: string[], currentLaunchPage: string, currentDashboard: string, currentMenus: MenuOption[]) => {
        const setting: any = { action: parseInt(currentMenuAction as any) };
        const launchSetting: any = { action: setting.action };

        switch (currentMenuAction) {
            case 1:
                launchSetting.menus = currentMenus
                    .filter((menu) => menu.selected && !menu.isHead)
                    .map((menu) => ({ name: menu.name, url: menu.url }));
                setting.selectedMenu = currentSelectedMenu;
                break;
            case 2:
                if (currentLaunchPage) {
                    const selLPage = currentMenus.find((menu) => menu.id === currentLaunchPage);
                    if (selLPage) {
                        launchSetting.url = selLPage.url;
                        setting.autoLaunch = currentLaunchPage;
                    }
                }
                break;
            case 3:
                if (currentDashboard) {
                    launchSetting.index = parseInt((currentDashboard || '0').replace('D-', ''));
                    setting.quickIndex = currentDashboard;
                }
                break;
            default:
                break;
        }

        $settings.set('menuAction', launchSetting);
        onSave(setting, 'launchAction');
    };

    const menuOptionSelected = (currentMenus: MenuOption[]) => {
        const selected = currentMenus.filter((m) => m.selected && !m.isHead).map((m) => m.id);
        setMenuAction(1);
        setSelectedMenu(selected);
        doSaveSettings(1, selected, selectedLaunchPage, selectedDashboard, currentMenus);
    };

    const menuTemplate = (menu: MenuOption) => {
        const isHeader = menu.isHead;
        return (
            <div
                onClick={(e) => handleMenuSelected(menu, e)}
                className={`cursor-pointer flex items-center gap-2 ${isHeader ? 'font-semibold' : 'pl-5'}`}
            >
                <Checkbox checked={menu.selected} />
                <span className="text-sm">{menu.name}</span>
            </div>
        );
    };

    const handleMenuSelected = (menu: MenuOption, event?: React.MouseEvent) => {
        if (event) {
            event.stopPropagation();
        }

        // Mutate the ref copy, then create a new array reference for state
        menu.selected = !menu.selected;

        if (menu.isHead) {
            selectSubMenus(menu);
        }

        const updatedMenus = [...menusRef.current];
        menusRef.current = updatedMenus;
        setMenus(updatedMenus);
        menuOptionSelected(updatedMenus);
    };

    const selectSubMenus = (menu: MenuOption) => {
        const menusList = menusRef.current;
        const menuIndex = menusList.indexOf(menu);
        for (let i = menuIndex + 1; i < menusList.length; i++) {
            const subMenu = menusList[i];
            if (subMenu.isHead) {
                return;
            }
            subMenu.selected = menu.selected;
        }
    };

    const autoLaunchOptionSelected = () => {
        const value = launchMenus[0]?.items?.[0]?.value;
        if (value) {
            handleLaunchPageChanged(value);
        } else {
            setMenuAction(2);
        }
    };

    const handleLaunchPageChanged = (autoLaunch: string) => {
        setMenuAction(2);
        setSelectedLaunchPage(autoLaunch);
        doSaveSettings(2, selectedMenu, autoLaunch, selectedDashboard, menusRef.current);
    };

    const quickViewOptionSelected = () => {
        const index = $dashboard.getQuickViewBoardIndex() || 0;
        handleDashboardChanged(`D-${index}`);
    };

    const handleDashboardChanged = (quickIndex: string) => {
        setMenuAction(3);
        setSelectedDashboard(quickIndex);
        doSaveSettings(3, selectedMenu, selectedLaunchPage, quickIndex, menusRef.current);
        const idx = parseInt((quickIndex || '0').replace('D-', '')) || 0;
        $dashboard.setQuickViewBoardIndex(idx);
    };

    return (
        <div className="divide-y divide-[--border-primary]">
            <div className="pb-5">
                <p className="text-sm text-[--text-secondary] mb-4">
                    Configure what happens when you click the Jira Assistant icon in your browser
                </p>

                <div className="text-sm font-semibold text-[--text-primary] mb-3">Click Action</div>
                <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-[--border-primary] cursor-pointer hover:bg-[--bg-hover] transition-colors">
                        <RadioButton checked={menuAction === 1} onChange={menuOptionSelected.bind(null, menus)} />
                        <div>
                            <div className="text-sm font-medium text-[--text-primary]">Show menus</div>
                            <div className="text-xs text-[--text-secondary]">Display a popup with selected menu items</div>
                        </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-[--border-primary] cursor-pointer hover:bg-[--bg-hover] transition-colors">
                        <RadioButton checked={menuAction === 2} onChange={autoLaunchOptionSelected} />
                        <div>
                            <div className="text-sm font-medium text-[--text-primary]">Auto launch page</div>
                            <div className="text-xs text-[--text-secondary]">Open a specific page directly</div>
                        </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-[--border-primary] cursor-pointer hover:bg-[--bg-hover] transition-colors">
                        <RadioButton checked={menuAction === 3} onChange={quickViewOptionSelected} />
                        <div>
                            <div className="text-sm font-medium text-[--text-primary]">Quick view dashboard</div>
                            <div className="text-xs text-[--text-secondary]">Show a dashboard as a compact popup</div>
                        </div>
                    </label>
                </div>
            </div>

            {menuAction === 1 && (
                <div className="pt-5">
                    <div className="text-sm font-semibold text-[--text-primary] mb-1">Visible Menus</div>
                    <p className="text-xs text-[--text-secondary] mb-3">Select which menu items appear in the popup</p>
                    <ListBox
                        options={menus.map((m) => ({ id: m.id, label: m.name, value: m }))}
                        multiple={true}
                        className="w-full max-w-xs"
                        maxHeight="280px"
                        itemTemplate={(opt) => menuTemplate(opt.value)}
                    />
                </div>
            )}

            {menuAction === 2 && (
                <div className="pt-5">
                    <div className="text-sm font-semibold text-[--text-primary] mb-1">Launch Page</div>
                    <p className="text-xs text-[--text-secondary] mb-3">Choose which page opens when clicking the icon</p>
                    <Dropdown
                        options={launchMenus.flatMap((g) => g.items.map((i) => ({ value: i.value, label: i.label })))}
                        value={selectedLaunchPage}
                        onChange={(e) => handleLaunchPageChanged(e.value)}
                        className="w-64"
                        placeholder="Select a page"
                    />
                </div>
            )}

            {menuAction === 3 && (
                <div className="pt-5">
                    <div className="text-sm font-semibold text-[--text-primary] mb-1">Dashboard</div>
                    <p className="text-xs text-[--text-secondary] mb-3">Choose which dashboard is displayed as quick view</p>
                    <Dropdown
                        options={dashboardMenus.map((m) => ({ value: m.value, label: m.label }))}
                        value={selectedDashboard}
                        onChange={(e) => handleDashboardChanged(e.value)}
                        className="w-64"
                        placeholder="Select a dashboard"
                    />
                </div>
            )}
        </div>
    );
}
