export const pokerBasePath = '/poker';

export function isPokerPath(pathname: string): boolean {
    return pathname === pokerBasePath || pathname.startsWith(`${pokerBasePath}/`);
}
