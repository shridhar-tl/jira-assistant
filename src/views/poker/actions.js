import { redirectToRoute } from "../../constants/build-info";
import { JAWebRootUrl } from "../../constants/urls";
import { Dialog } from "../../dialogs/CommonDialog";
import {
    insertRoomRecord, joinAsMember, addIssue, beginEstimate,
    subscribeRoomChanges, updateVote, updateRevealStatus,
    subscribeUserChanges, signOutUser, subscribePointerChanges,
    clearAndExit, updateIssues, updateAvatar, updateRoom,
} from "./firestore";
import { storeAuthInfo, getAuthDetails, loadAuthInfo, clearAuthInfo } from './utils';

export function createRoom(setState) {
    return async function ({ email, roomName, name, scoreType, avatarUrl, avatarId }) {
        const { token, sid, roomId } = await getAuthDetails(email);
        const roomInfo = {
            token, sid, roomId, roomName, name,
            email, scoreType, avatarUrl, avatarId, showConfigs: true
        };
        storeAuthInfo(roomInfo);
        await insertRoomRecord(roomInfo);
        setState(roomInfo);
        return roomInfo;
    };
}

export function joinRoom(setState) {
    return async function ({ email, roomId, name, avatarUrl, avatarId }) {
        const { token, sid } = await getAuthDetails(email, roomId);

        const authInfo = { token, sid, roomId, name };
        storeAuthInfo(authInfo);

        const user = { sid, roomId, name, email, avatarUrl, avatarId };
        await joinAsMember(authInfo, user);

        setState(authInfo);

        return user;
    };
}

function mapReduce(arr) {
    if (!arr || !arr.length) {
        return {};
    }

    return arr.reduce((obj, cur) => {
        obj[cur.id] = cur;
        return obj;
    }, {});
}

export function watchRoom(setState, getState) {
    return async function (roomId) {
        const usRoom = subscribeRoomChanges(roomId, function (data) {
            const { viewingIssueId: vID, currentIssueId: cID, sid, moderatorId: mid } = getState();
            const { currentIssueId, issues, moderatorId, created } = data;
            const isModerator = sid === mid;
            if (!moderatorId || !created) {
                unsubscribe();
                if (!isModerator) {
                    clearSession(isModerator);
                }
                return;
            }

            // Update the current viewing issue if nothing is being viewed
            // or if moderator has changed the issue being estimated
            if (!vID || !cID || cID !== currentIssueId) {
                data.viewingIssueId = currentIssueId;
            }

            data.issuesMap = mapReduce(issues);

            setState(data);
        });

        function getVotesMap(members, votes) {
            const ids = members.map(({ id }) => id);

            return votes.reduce((obj, cur) => {
                obj[cur.id] = cur;
                if (cur.reveal) {
                    const allVotes = ids.map(id => cur[id]).filter(vote => typeof vote === 'number');

                    cur.average = allVotes.avg();
                    cur.maxVote = allVotes.max();
                }
                return obj;
            }, getState('votesMap'));
        }

        const usUsers = subscribeUserChanges(roomId, function (members) {
            const { votes } = getState();
            const votesMap = getVotesMap(members, votes);
            setState({ members, membersMap: mapReduce(members), votesMap });
            const { moderatorId, sid, autoReveal, currentIssueId } = getState();

            if (autoReveal && moderatorId === sid) {
                if (members.every(u => !!u[`vote_${currentIssueId}`])) {
                    revealVote(setState, getState)();
                }
            }
        });

        const usVotes = subscribePointerChanges(roomId, function (votes) {
            const { members } = getState();
            const votesMap = getVotesMap(members, votes);
            setState({ votes, votesMap });
        });

        function unsubscribe() {
            usRoom();
            usUsers();
            usVotes();
        }

        return unsubscribe;
    };
}

export function submitVote(setState, getState) {
    return async function (vote) {
        const { roomId, sid, currentIssueId: issueId, votesMap: map } = getState();
        const votesMap = { ...map };
        if (votesMap?.[issueId]?.reveal) { return; }

        await updateVote(roomId, sid, issueId, vote);

        votesMap[issueId] = { ...votesMap[issueId], [sid]: vote };
        setState({ votesMap });
    };
}

export function loadAuthInfoFromCache(setState) {
    return async function (roomId) {
        if (!roomId) {
            return;
        }

        const data = await loadAuthInfo(roomId);
        if (data) {
            setState(data);
        } else {
            signOutUser();
        }
    };
}

// #region Issues collection actions
const getNewId = () => (Math.random() + 1).toString(36).substring(7);

export function addNewIssue(_, getState) {
    return async function (issue) {
        if (!issue) { return; }

        if (typeof issue === 'string') {
            issue = { key: issue };
        }

        const { root, key, url, img: icon, summaryText: summary } = issue;
        const toAdd = { root, id: getNewId(), key, url, icon, summary };

        await addIssue(getState('roomId'), toAdd, false);
    };
}

export function removeIssue(setState, getState) {
    return async function (issueId) {
        const { issues: list, roomId, currentIssueId: cID, viewingIssueId: vID } = getState();
        const issues = list.filter(issue => issue.id !== issueId);

        await updateIssues(roomId, issues, cID === issueId);

        if (vID === issueId) {
            setState({ viewingIssueId: issues[0]?.id });
        }
    };
}

export function selectIssue(setState) {
    return function (issueId) {
        setState({ viewingIssueId: issueId });
    };
}

// #endregion


// #region Control box actions

export function revealVote(_, getState) {
    return async function () {
        const { roomId, currentIssueId } = getState();
        await updateRevealStatus(roomId, currentIssueId);
    };
}

export function startEstimation(_, getState) {
    return function () {
        const { roomId, viewingIssueId: issueId } = getState();
        return beginEstimate(roomId, issueId, { currentIssueId: issueId });
    };
}

export function restartEstimation(_, getState) {
    return function () {
        const { roomId, viewingIssueId: issueId, issues: issuesList } = getState();
        const id = getNewId();
        const issues = issuesList.map(issue => (issue.id === issueId ? ({ ...issue, id }) : issue));

        return beginEstimate(roomId, issueId, { currentIssueId: id, issues });
    };
}

export function exitRoom(_, getState) {
    return async function () {
        const { roomId, sid, moderatorId, votesMap, members } = getState();
        const isModerator = moderatorId === sid;

        await clearAndExit(roomId, sid, isModerator && {
            votesList: Object.keys(votesMap),
            membersList: members.map(({ id }) => id),
        });

        if (isModerator) {
            clearSession(isModerator);
        } else {
            closePoker();
        }
    };
}

export function copyUrl(_, getState) {
    return function () {
        const roomId = getState('roomId');
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(`${JAWebRootUrl}/poker/${roomId}`);
        }
    };
}

// #endregion

export function setAvatar(_, getState) {
    return async function (avatarId) {
        if (typeof avatarId !== 'number') {
            avatarId = null;
        }
        const { roomId, sid } = getState();
        await updateAvatar(roomId, sid, avatarId);
    };
}

export function showSettings(setState) {
    return function () {
        setState({ showConfigs: true });
    };
}

export function hideSettings(setState) {
    return function () {
        setState({ showConfigs: false });
    };
}

export function saveSettings(_, getState) {
    return function (value, field) {
        updateRoom(getState('roomId'), { [field]: value });
    };
}

// #region Private functions

function clearSession(isModerator) {
    signOutUser();
    const msg = `This room is closed${!isModerator ? ' by the moderator' : ''}. Please close this window.`;
    Dialog.alert(msg, "Room Closed").then(closePoker);
}

function closePoker() {
    clearAuthInfo();
    window.close();
    redirectToRoute('/poker');
}

// #endregion