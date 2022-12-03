import moment from 'moment';
import { calcCostPerSecs, getUserName, viewIssueUrl } from "../../../common/utils";
import { inject } from '../../../services/injector-service';

function getWorklogFilter(fromDate, toDate, state) {
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

    const isInRange = (worklog) => moment(worklog.started).isBetween(fromDate, toDate);

    if (logFilterType === '1') {
        return isInRange;
    } else {
        const before = logFilterType === '2';
        const useUpdatedDate = wlDateSelection !== '2';
        return function (worklog) {
            if (!isInRange(worklog)) {
                return false;
            }

            const threshold = filterDate || moment(worklog.started).add(filterDays, 'days').endOf('day');

            return before === moment(useUpdatedDate ? (worklog.updated || worklog.created) : worklog.created).isBefore(threshold);
        };
    }
}

export function getUserWiseWorklog(issues, fromDate, toDate, currentUser, state) {
    const svc = inject('UserUtilsService', 'SessionService');
    const epicNameField = svc.$session.CurrentUser.epicNameField?.id;
    const options = { epicNameField, ...svc };
    const isWorklogInRange = getWorklogFilter(fromDate, toDate, state);
    const report = {};

    issues.forEach(issue => {
        const fields = issue.fields || {};
        const worklogs = fields.worklog?.worklogs || [];

        const totalLogged = worklogs.sum(wl => wl.timeSpentSeconds);
        const originalestimate = fields.timeoriginalestimate || 0;
        const remainingestimate = fields.timeestimate || 0;
        const estVariance = originalestimate > 0 ? (remainingestimate + totalLogged) - originalestimate : 0;
        const toAppend = { originalestimate, remainingestimate, totalLogged, estVariance };

        worklogs.forEach(worklog => {
            if (!isWorklogInRange(worklog)) {
                return;
            }

            const userName = getUserName(worklog.author, true);
            const isCurrentUser = userName === currentUser;
            let reportUser = report[userName];
            if (!reportUser) {
                reportUser = {
                    logData: [], userName, isCurrentUser,
                    ...worklog.author
                };
                report[userName] = reportUser;
            }

            const log = getLogUserObj(issue, fields, worklog, toAppend, options);

            reportUser.logData.push(log);
        });
    });

    return {
        userwiseLog: report,
        userwiseLogArr: Object.keys(report).map(k => {
            const userData = report[k];
            userData.totalHours = userData.logData.sum((t) => t.totalHours);
            return userData;
        })
    };
}

export function generateUserDayWiseData(data, groups, pageSettings) {
    const svc = inject('UtilsService', 'UserUtilsService', 'SessionService');
    const { maxHours, minHours = maxHours } = svc.$session.CurrentUser;
    const maxSecsPerDay = (maxHours || 8) * 60 * 60;
    const minSecsPerDay = (minHours || 8) * 60 * 60;

    const { timeZone, fromDate, toDate } = pageSettings;
    const datesArr = svc.$utils.getDateArray(fromDate, toDate);
    const dates = datesArr.map(d => ({
        prop: d.format('yyyyMMdd'),
        display: d.format('DDD, dd'),
        date: d,
        isHoliday: svc.$userutils.isHoliday(d)
    }));
    const months = datesArr.groupBy((d) => d.format("MMM, yyyy")).map(grp => ({ monthName: grp.key, days: grp.values.length }));


    const timezoneSetting = parseInt(timeZone);

    const groupedData = groups.map(grp => {
        const grpInfo = {
            name: grp.name,
            total: {},
            totalCost: {},
            grandTotal: 0,
            grandTotalCost: 0,
            users: null
        };

        grpInfo.users = grp.users.map(usr => {
            let curTimeZone = null;
            if (timezoneSetting === 2) {
                curTimeZone = grp.timeZone;
            }
            else if (timezoneSetting === 3) {
                curTimeZone = usr.timeZone || grp.timeZone;
            }

            if (curTimeZone === "GRP_TZ") {
                curTimeZone = grp.timeZone;
            }

            const usrInfo = {
                name: getUserName(usr),
                displayName: usr.displayName,
                emailAddress: usr.emailAddress,
                timeZone: curTimeZone,
                imageUrl: usr.avatarUrls['48x48'] || usr.avatarUrls['32x32'],
                profileUrl: usr.self,
                costPerHour: usr.costPerHour,
                tickets: null,
                total: {},
                totalCost: {},
                logClass: {},
                grandTotal: 0,
                grandTotalCost: 0
            };

            const usrDta = data[usr.userName || getUserName(usr)] || {};

            if (usrDta.isCurrentUser) {
                usrInfo.isCurrentUser = true;
            }

            const logData = usrDta.logData || [];
            const ticketsMap = {};
            usrInfo.ticketsMap = ticketsMap;
            usrInfo.tickets = logData.groupBy(lGrp => lGrp.ticketNo)
                .map(tGrp => {
                    const items = tGrp.values;
                    const firstTkt = items.first();
                    const logs = {};

                    const ticket = {
                        ticketNo: tGrp.key,
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
                        statusName: firstTkt.statusName,
                        summary: firstTkt.summary,
                        originalestimate: firstTkt.originalestimate,
                        remainingestimate: firstTkt.remainingestimate,
                        totalLogged: firstTkt.totalLogged,
                        estVariance: firstTkt.estVariance,
                        url: firstTkt.url,
                        logs: logs,
                        totalHours: 0,
                        totalCost: 0
                    };
                    ticketsMap[ticket.ticketNo] = ticket;
                    let totalHours = 0;
                    items.forEach(item => {
                        let logTime = item.logTime;
                        if (curTimeZone) {
                            logTime = moment(moment(logTime).tz(curTimeZone).format('YYYY-MM-DD HH:mm:ss')).toDate();
                        }
                        const dateFormated = logTime.format('yyyyMMdd');
                        let logForDate = logs[dateFormated];
                        if (!logForDate) {
                            logForDate = [];
                            logs[dateFormated] = logForDate;
                        }
                        logForDate.push({
                            logTime: logTime,
                            totalHours: item.totalHours,
                            totalCost: calcCostPerSecs(item.totalHours, usr.costPerHour),
                            comment: item.comment
                        });
                        totalHours += item.totalHours;
                    });
                    ticket.totalHours = totalHours;
                    ticket.totalCost = calcCostPerSecs(totalHours, usr.costPerHour);
                    return ticket;
                });
            // Set date wise total per user
            const logClass = usrInfo.logClass;
            const usrTotal = usrInfo.total;
            const usrTotalCost = usrInfo.totalCost;
            let usrGTotal = 0;
            dates.forEach(d => {
                const totalHrs = usrInfo.tickets.sum(t => {
                    const lgArr = t.logs[d.prop];
                    if (lgArr) {
                        return lgArr.sum(l => l.totalHours);
                    } else {
                        return 0;
                    }
                });
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
        });

        grpInfo.usersMap = grpInfo.users.reduce((obj, u) => {
            obj[u.name] = u;
            return obj;
        }, {});

        // Set date wise total per group
        const grpTotal = grpInfo.total;
        const grpTotalCost = grpInfo.totalCost;
        let grpGTotal = 0;
        let grpGTotalCost = 0;
        dates.forEach(d => {
            const totalHrs = grpInfo.users.sum(u => u.total[d.prop] || 0);
            if (totalHrs > 0) {
                grpTotal[d.prop] = totalHrs;
                grpGTotal += totalHrs;
            }
            const totalCost = grpInfo.users.sum(u => u.totalCost[d.prop] || 0);
            if (totalCost > 0) {
                grpTotalCost[d.prop] = totalCost;
                grpGTotalCost += totalCost;
            }
        });
        grpInfo.grandTotal = grpGTotal;
        grpInfo.grandTotalCost = grpGTotalCost;
        return grpInfo;
    });

    // Set date wise total for all groups
    let grandTotal = 0;
    let grandTotalCost = 0;
    const grpTotal = {};
    const grpTotalCost = {};
    dates.forEach(d => {
        const totalHrs = groupedData.sum(u => u.total[d.prop] || 0);
        if (totalHrs > 0) {
            grpTotal[d.prop] = totalHrs;
            grandTotal += totalHrs;
        }

        const totalCost = groupedData.sum(u => u.totalCost[d.prop] || 0);
        if (totalCost > 0) {
            grpTotalCost[d.prop] = totalCost;
            grandTotalCost += totalCost;
        }
    });

    groupedData.grandTotal = grandTotal;
    groupedData.grandTotalCost = grandTotalCost;
    groupedData.total = grpTotal;
    groupedData.totalCost = grpTotalCost;

    return { groupedData, months, dates };
}

function getLogUserObj(issue, fields, worklog, append, { epicNameField, $userutils }) {
    const obj = {
        ticketNo: issue.key,
        epicDisplay: null,
        epicUrl: null,
        url: $userutils.getTicketUrl(issue.key),
        issueType: fields.issuetype?.name,
        parent: fields.parent?.key,
        parentSummary: fields.parent?.fields?.summary,
        assignee: fields.assignee?.displayName,
        reporter: fields.reporter?.displayName,
        summary: fields.summary,
        logTime: moment(worklog.started).toDate(),
        comment: worklog.comment,
        projectName: fields.project.name,
        statusName: fields.status?.name,
        projectKey: fields.project.key,
        totalHours: worklog.timeSpentSeconds,
        ...append
    };

    if (epicNameField) {
        obj.epicDisplay = fields[epicNameField];
        const key = obj.ticketNo.split('-')[0];
        if (obj.epicDisplay && obj.epicDisplay.indexOf(`${key}-`) === 0) {
            obj.epicUrl = $userutils.getTicketUrl(obj.epicDisplay);
        }
    }

    return obj;
}

function getCssClass(day, time, maxSecsPerDay, minSecsPerDay) {
    time = time > 0 ? time : 0;
    if (day.isHoliday) {
        return time ? 'log-high' : 'col-holiday';
    }
    else {
        if (time >= minSecsPerDay && time <= maxSecsPerDay) {
            return 'log-good';
        }
        else if (time < minSecsPerDay) {
            return 'log-less';
        }
        else if (time > maxSecsPerDay) {
            return 'log-high';
        }
    }
}
