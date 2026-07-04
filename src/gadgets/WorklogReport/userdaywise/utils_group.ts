import moment from 'moment-timezone';

import { getDateRange } from '@/utils';

import { inject } from '../../../services/injector';
import { getProjectKeys, getUniqueUsersFromGroup } from '../utils';

function getUserName(user: any, includeEmail?: boolean): string {
    if (!user) return '';
    const name = user.name || user.emailAddress || user.displayName || '';
    return includeEmail && user.emailAddress ? user.emailAddress : name;
}

function calcCostPerSecs(secs: number, costPerHour?: number): number {
    if (!costPerHour || !secs) return 0;
    return parseFloat(((secs / 3600) * costPerHour).toFixed(2));
}

function viewIssueUrl(ticketNo: string): string {
    const { $userutils } = inject('UserUtilsService');
    return $userutils.getTicketUrl(ticketNo)!;
}

function getWorklogFilter(fromDate: moment.Moment, toDate: moment.Moment, state: any) {
    const { logFilterType, filterThrsType, filterDays, wlDateSelection } = state;

    let { filterDate } = state;
    if (filterThrsType === '1') {
        filterDate = null;
    } else if (filterThrsType === '2') {
        filterDate = moment(toDate).clone().add(filterDays, 'days');
    }

    if (filterDate) {
        filterDate = moment(filterDate).endOf('day');
    }

    const isInRange = (worklog: any) => moment(worklog.started).isBetween(fromDate, toDate, undefined, '[]');

    if (logFilterType === '1') {
        return isInRange;
    } else {
        const before = logFilterType === '2';
        const useUpdatedDate = wlDateSelection !== '2';
        return function (worklog: any) {
            if (!isInRange(worklog)) {
                return false;
            }

            const threshold = filterDate || moment(worklog.started).add(filterDays, 'days').endOf('day');

            return before === moment(useUpdatedDate ? worklog.updated || worklog.created : worklog.created).isBefore(threshold);
        };
    }
}

export async function getEpicDetails(issues: any[], epicNameField?: string) {
    if (epicNameField) {
        const { $ticket, $message } = inject('MessageService', 'TicketService');
        try {
            const epicKeys = Array.from(new Set(issues.map(({ fields }: any) => fields[epicNameField]).filter(Boolean)));
            const epicList = await $ticket.getTicketDetails(epicKeys, false, ['summary', 'issuetype']);

            return epicList;
        } catch (err: any) {
            $message.error('Epic fetch failed', `Error Message: ${err.message}`);

            return {};
        }
    }
}

export function getUserWiseWorklog(
    issues: any[],
    fromDate: moment.Moment,
    toDate: moment.Moment,
    currentUser: string | undefined,
    state: any,
    epicDetails: any,
) {
    const svc = inject('UserUtilsService', 'SessionService');
    const epicNameField = svc.$session.CurrentUser.epicNameField?.id;
    const options = { epicNameField, epicDetails, ...svc };

    const isWorklogInRange = getWorklogFilter(fromDate, toDate, state);
    const report: any = {};

    issues.forEach((issue) => {
        const fields = issue.fields || {};
        const worklogs = fields.worklog?.worklogs || [];

        const totalLogged = fields.aggregatetimespent || 0;
        const originalestimate = fields.timeoriginalestimate || 0;
        const remainingestimate = fields.timeestimate || 0;
        const estVariance = originalestimate > 0 ? remainingestimate + totalLogged - originalestimate : 0;
        const toAppend = { originalestimate, remainingestimate, totalLogged, estVariance };

        worklogs.forEach((worklog: any) => {
            if (!isWorklogInRange(worklog)) {
                return;
            }

            const userName = getUserName(worklog.author, true);
            const isCurrentUser = userName === currentUser;
            let reportUser = report[userName];
            if (!reportUser) {
                reportUser = {
                    logData: [],
                    userName,
                    isCurrentUser,
                    ...worklog.author,
                };
                report[userName] = reportUser;
            }

            const log = getLogUserObj(issue, fields, worklog, toAppend, options);

            reportUser.logData.push(log);
        });
    });

    if (state.userListMode === '2') {
        const users = getUniqueUsersFromGroup(state);
        Object.keys(report).forEach((uid) => {
            if (!users?.includes(uid)) {
                delete report[uid];
            }
        });
    } else if (state.userListMode === '4') {
        const projectKeys = getProjectKeys(state);
        const users = getUniqueUsersFromGroup(state);

        const usersInReportNotSelected = Object.keys(report).filter((u) => !users?.includes(u));
        usersInReportNotSelected.forEach((uid) => {
            const reportUser = report[uid];

            let { logData } = reportUser;
            logData = logData.filter((t: any) => projectKeys?.includes(t.projectKey?.toUpperCase()));

            if (logData.length) {
                reportUser.logData = logData;
            } else {
                delete report[uid];
            }
        });
    }

    return {
        userwiseLog: report,
        userwiseLogArr: Object.keys(report)
            .map((k) => {
                const userData = report[k];
                userData.totalHours = userData.logData.reduce((sum: number, t: any) => sum + t.totalHours, 0);
                return userData;
            })
            .sort((a, b) => a.displayName.localeCompare(b.displayName)),
    };
}

export function getWeekHeader(dates: any[]) {
    const grouped: any = {};
    dates.forEach((d) => {
        const key = `${d.month}_${d.week}`;
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(d);
    });

    return Object.values(grouped).map((values: any) => {
        const days = values.length;
        let display;
        const first = values[0];
        const last = values[days - 1];
        const { week, dispFormat } = first;

        if (days > 4) {
            display = `${dispFormat}, ${first.dateNum} to ${last.dateNum} (W-${week})`;
        } else if (days > 3) {
            display = `${dispFormat}, ${first.dateNum}-${last.dateNum}`;
        } else if (days > 2) {
            display = `${dispFormat.split(' ')[0]} (W-${week})`;
        } else {
            display = dispFormat.split(' ')[0];
        }

        return { display, days };
    });
}

export function generateUserDayWiseData(data: any, groups: any[], pageSettings: any) {
    const { $userutils, $session } = inject('UserUtilsService', 'SessionService');
    const { maxHours, minHours = maxHours } = $session.CurrentUser;
    const maxSecsPerDay = (maxHours || 8) * 60 * 60;
    const minSecsPerDay = (minHours || 8) * 60 * 60;

    const { timeZone, fromDate, toDate } = pageSettings;

    let { dates, daysToHide } = pageSettings;
    if (!dates) {
        dates = getDateRange(fromDate, toDate, $userutils.isHoliday);
    } else {
        daysToHide = false;
    }

    const timezoneSetting = parseInt(timeZone);

    const groupedData = groups.map((grp) => {
        const grpInfo: any = {
            name: grp.name,
            total: {},
            totalCost: {},
            grandTotal: 0,
            grandTotalCost: 0,
            users: null,
        };
        if (grp.isDummy) {
            grpInfo.isDummy = grp.isDummy;
        }

        grpInfo.users = grp.users
            .map((usr: any) => {
                let curTimeZone = null;
                if (timezoneSetting === 2) {
                    curTimeZone = grp.timeZone;
                } else if (timezoneSetting === 3) {
                    curTimeZone = usr.timeZone || grp.timeZone;
                }

                if (curTimeZone === 'GRP_TZ') {
                    curTimeZone = grp.timeZone;
                }

                const worklogUser = {
                    name: getUserName(usr),
                    displayName: usr.displayName,
                    emailAddress: usr.emailAddress,
                    timeZone: curTimeZone,
                    imageUrl: usr.avatarUrls?.['48x48'] || usr.avatarUrls?.['32x32'],
                    profileUrl: $userutils.getProfileUrl(usr),
                    costPerHour: usr.costPerHour,
                };

                const usrInfo: any = {
                    ...worklogUser,
                    tickets: null,
                    total: {},
                    totalCost: {},
                    logClass: {},
                    grandTotal: 0,
                    grandTotalCost: 0,
                };

                const usrDta = data[usr.userName || getUserName(usr, true)] || {};

                if (usrDta.isCurrentUser) {
                    usrInfo.isCurrentUser = true;
                }

                const logData = usrDta.logData || [];
                const ticketsMap: any = {};
                usrInfo.ticketsMap = ticketsMap;

                const groupedLogs: any = {};
                logData.forEach((log: any) => {
                    const key = log.ticketNo;
                    if (!groupedLogs[key]) {
                        groupedLogs[key] = [];
                    }
                    groupedLogs[key].push(log);
                });

                usrInfo.tickets = Object.entries(groupedLogs).map(([ticketNo, items]: [string, any]) => {
                    const firstTkt = items[0];
                    const logs: any = {};

                    const ticket: any = {
                        fields: { ...firstTkt.fields, worklogUser },
                        ticketNo,
                        parent: firstTkt.parent,
                        parentUrl: firstTkt.parent ? viewIssueUrl(firstTkt.parent) : null,
                        parentSummary: firstTkt.parentSummary,
                        projectKey: firstTkt.projectKey,
                        projectName: firstTkt.projectName,
                        assignee: firstTkt.assignee,
                        reporter: firstTkt.reporter,
                        epicDisplay: firstTkt.epicDisplay,
                        epicUrl: firstTkt.epicUrl,
                        issueType: firstTkt.issueType,
                        iconUrl: firstTkt.iconUrl,
                        statusName: firstTkt.statusName,
                        summary: firstTkt.summary,
                        originalestimate: firstTkt.originalestimate,
                        remainingestimate: firstTkt.remainingestimate,
                        totalLogged: firstTkt.totalLogged,
                        estVariance: firstTkt.estVariance,
                        url: firstTkt.url,
                        logs: logs,
                        totalHours: 0,
                        totalCost: 0,
                    };

                    ticketsMap[ticket.ticketNo] = ticket;
                    let totalHours = 0;
                    items.forEach((item: any) => {
                        let logTime = item.logTime;
                        if (curTimeZone) {
                            logTime = moment(moment(logTime).tz(curTimeZone).format('YYYY-MM-DD HH:mm:ss')).toDate();
                        }
                        const dateFormated = moment(logTime).format('YYYYMMDD');
                        let logForDate = logs[dateFormated];
                        if (!logForDate) {
                            logForDate = [];
                            logs[dateFormated] = logForDate;
                        }
                        logForDate.push({
                            logTime: logTime,
                            totalHours: item.totalHours,
                            totalCost: calcCostPerSecs(item.totalHours, usr.costPerHour),
                            comment: item.comment,
                        });
                        totalHours += item.totalHours;
                    });
                    ticket.totalHours = totalHours;
                    ticket.totalCost = calcCostPerSecs(totalHours, usr.costPerHour);
                    return ticket;
                });

                arrangeTicketsByFirstWorklogDate(usrInfo, dates);

                const logClass = usrInfo.logClass;
                const usrTotal = usrInfo.total;
                const usrTotalCost = usrInfo.totalCost;
                let usrGTotal = 0;
                dates.forEach((d: any) => {
                    const totalHrs = usrInfo.tickets.reduce((sum: number, t: any) => {
                        const lgArr = t.logs[d.prop];
                        if (lgArr) {
                            return sum + lgArr.reduce((s: number, l: any) => s + l.totalHours, 0);
                        } else {
                            return sum;
                        }
                    }, 0);
                    if (totalHrs > 0) {
                        usrTotal[d.prop] = totalHrs;
                        usrTotalCost[d.prop] = calcCostPerSecs(totalHrs, usr.costPerHour);
                        usrGTotal += totalHrs;
                    }
                    logClass[d.prop] = getCssClass(d, totalHrs, maxSecsPerDay, minSecsPerDay);
                });
                usrInfo.grandTotal = usrGTotal;
                usrInfo.grandTotalCost = calcCostPerSecs(usrGTotal, usr.costPerHour);
                return usrInfo;
            })
            .sort((a: any, b: any) => a.firstWorklogStartIndex - b.firstWorklogStartIndex);

        grpInfo.usersMap = grpInfo.users.reduce((obj: any, u: any) => {
            obj[u.name] = u;
            return obj;
        }, {});

        const grpTotal = grpInfo.total;
        const grpTotalCost = grpInfo.totalCost;
        let grpGTotal = 0;
        let grpGTotalCost = 0;
        dates.forEach((d: any) => {
            const totalHrs = grpInfo.users.reduce((sum: number, u: any) => sum + (u.total[d.prop] || 0), 0);
            if (totalHrs > 0) {
                grpTotal[d.prop] = totalHrs;
                grpGTotal += totalHrs;
            }
            const totalCost = grpInfo.users.reduce((sum: number, u: any) => sum + (u.totalCost[d.prop] || 0), 0);
            if (totalCost > 0) {
                grpTotalCost[d.prop] = totalCost;
                grpGTotalCost += totalCost;
            }
        });
        grpInfo.grandTotal = grpGTotal;
        grpInfo.grandTotalCost = grpGTotalCost;
        return grpInfo;
    });

    let grandTotal = 0;
    let grandTotalCost = 0;
    const grpTotal: any = {};
    const grpTotalCost: any = {};
    dates.forEach((d: any) => {
        const totalHrs = groupedData.reduce((sum: number, u: any) => sum + (u.total[d.prop] || 0), 0);
        if (totalHrs > 0) {
            grpTotal[d.prop] = totalHrs;
            grandTotal += totalHrs;
        }

        d.hasWorklogs = d.hasWorklogs || totalHrs > 0;

        const totalCost = groupedData.reduce((sum: number, u: any) => sum + (u.totalCost[d.prop] || 0), 0);
        if (totalCost > 0) {
            grpTotalCost[d.prop] = totalCost;
            grandTotalCost += totalCost;
        }
    });

    (groupedData as any).grandTotal = grandTotal;
    (groupedData as any).grandTotalCost = grandTotalCost;
    (groupedData as any).total = grpTotal;
    (groupedData as any).totalCost = grpTotalCost;

    dates = filterDaysWithoutWorklog(daysToHide, dates);

    return { groupedData, weeks: getWeekHeader(dates), dates };
}

function arrangeTicketsByFirstWorklogDate(user: any, dates: any[]) {
    const tickets = user.tickets;

    tickets.forEach((t: any) => {
        const { logs } = t;
        t.worklogStartIndex = dates.findIndex((d) => !!logs[d.prop]);
    });

    user.tickets = tickets.sort((a: any, b: any) => a.worklogStartIndex - b.worklogStartIndex);
    user.firstWorklogStartIndex = user.tickets[0]?.worklogStartIndex;
}

export function filterDaysWithoutWorklog(daysToHide: string, dates: any[]) {
    if (!daysToHide || daysToHide === '1') {
        return dates;
    }

    const hideNonWorkingDays = daysToHide === '2',
        hideDaysWithoutWorklog = daysToHide === '3';

    if (hideNonWorkingDays || hideDaysWithoutWorklog) {
        return dates.filter((d: any) => d.hasWorklogs || (!hideDaysWithoutWorklog && !d.isHoliday));
    }

    return dates;
}

function getLogUserObj(issue: any, fields: any, worklog: any, append: any, { epicNameField, epicDetails, $userutils }: any) {
    const obj: any = {
        fields,
        ticketNo: issue.key,
        epicDisplay: null,
        epicUrl: null,
        url: $userutils.getTicketUrl(issue.key),
        issueType: fields.issuetype?.name,
        iconUrl: fields.issuetype?.iconUrl,
        parent: fields.parent?.key,
        parentSummary: fields.parent?.fields?.summary,
        assignee: fields.assignee?.displayName,
        reporter: fields.reporter?.displayName,
        summary: fields.summary,
        logTime: moment(worklog.started).toDate(),
        logCreated: moment(worklog.created).toDate(),
        logUpdated: moment(worklog.updated || worklog.created).toDate(),
        comment: worklog.comment,
        projectName: fields.project.name,
        statusName: fields.status?.name,
        projectKey: fields.project.key,
        totalHours: worklog.timeSpentSeconds,
        ...append,
    };

    if (epicNameField) {
        const epicKey = fields[epicNameField];
        if (typeof epicKey === 'string' && epicKey.includes('-')) {
            obj.epicKey = epicKey;
            const epicDetail = epicDetails[epicKey];
            if (epicDetail?.fields) {
                const {
                    key,
                    fields: {
                        summary,
                        issuetype: { iconUrl },
                    },
                } = epicDetail;
                obj.epicDisplay = `${key} - ${summary}`;
                obj.epicIcon = iconUrl;
            }
            obj.epicUrl = $userutils.getTicketUrl(epicKey);
        } else {
            obj.epicDisplay = epicKey;
        }
    }

    return obj;
}

function getCssClass(day: any, time: number, maxSecsPerDay: number, minSecsPerDay: number) {
    time = time > 0 ? time : 0;
    if (day.isHoliday) {
        return time ? 'log-high' : 'col-holiday';
    } else {
        if (time >= minSecsPerDay && time <= maxSecsPerDay) {
            return 'log-good';
        } else if (time < minSecsPerDay) {
            return 'log-less';
        } else if (time > maxSecsPerDay) {
            return 'log-high';
        }
    }
}
