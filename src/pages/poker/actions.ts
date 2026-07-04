import { useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { WebSiteUrl, JAWebRootUrl } from '@/constants/urls';
import { Dialog } from '@/dialogs';
import { usePokerStore } from '@/stores/poker-store';

import {
    insertRoomRecord,
    joinAsMember,
    addIssue,
    beginEstimate,
    subscribeRoomChanges,
    updateVote,
    updateRevealStatus,
    subscribeUserChanges,
    signOutUser,
    subscribePointerChanges,
    clearAndExit,
    updateIssues,
    updateAvatar,
    updateRoom,
} from './firestore';
import type { PokerIssue } from './types';
import { storeAuthInfo, getAuthDetails, loadAuthInfo, clearAuthInfo } from './utils';

const generateId = () => (Math.random() + 1).toString(36).substring(7);

function mapReduce<T extends { id: string }>(arr: T[]): Record<string, T> {
    if (!arr?.length) {
        return {};
    }
    return arr.reduce(
        (obj, cur) => {
            obj[cur.id] = cur;
            return obj;
        },
        {} as Record<string, T>,
    );
}

export function usePokerActions() {
    const navigate = useNavigate();
    const { setState, ...state } = usePokerStore();

    const createRoom = useCallback(
        async ({ email, roomName, name, scoreType, avatarUrl, avatarId }: any) => {
            const { token, sid, roomId } = await getAuthDetails(email);
            const roomInfo = {
                token,
                sid,
                roomId,
                roomName,
                name,
                email,
                scoreType,
                avatarUrl,
                avatarId,
                showConfigs: true,
            };
            storeAuthInfo(roomInfo);
            await insertRoomRecord(roomInfo);
            setState(roomInfo);
            return roomInfo;
        },
        [setState],
    );

    const joinRoom = useCallback(
        async ({ email, roomId, name, avatarUrl, avatarId }: any) => {
            const { token, sid } = await getAuthDetails(email, roomId);

            const authInfo = { token, sid, roomId, name };
            storeAuthInfo(authInfo);

            const user = { sid, roomId, name, email, avatarUrl, avatarId };
            const result = await joinAsMember(authInfo, user);
            if (result && typeof result === 'object' && 'field' in result) {
                return result;
            }

            setState(authInfo);
            return user;
        },
        [setState],
    );

    const watchRoom = useCallback((roomId: string) => {
        const getState = () => usePokerStore.getState();

        const usRoom = subscribeRoomChanges(roomId, (data) => {
            const { viewingIssueId: vID, currentIssueId: cID, sid, moderatorId: mid, setState: set } = getState();
            const { currentIssueId, issues, moderatorId, created } = data;
            const isModerator = sid === mid;

            if (!moderatorId || !created) {
                unsubscribe();
                if (!isModerator) {
                    clearSession(isModerator);
                }
                return;
            }

            if (!vID || !cID || cID !== currentIssueId) {
                data.viewingIssueId = currentIssueId;
            }

            data.issuesMap = mapReduce(issues);
            set(data);
        });

        function getVotesMap(members: any[], votes: any[]) {
            const ids = members.map(({ id }) => id);
            const { votesMap: currentVotesMap } = getState();

            return votes.reduce((obj, cur) => {
                obj[cur.id] = cur;
                if (cur.reveal) {
                    const allVotes = ids.map((id) => cur[id]).filter((vote) => typeof vote === 'number');

                    if (allVotes.length > 0) {
                        cur.average = allVotes.reduce((a, b) => a + b, 0) / allVotes.length;
                        cur.maxVote = Math.max(...allVotes);
                    }
                }
                return obj;
            }, currentVotesMap);
        }

        const usUsers = subscribeUserChanges(roomId, (members) => {
            const { votes, moderatorId, sid, autoReveal, currentIssueId, setState: set } = getState();
            const votesMap = getVotesMap(members, votes);
            set({ members, membersMap: mapReduce(members), votesMap });

            if (autoReveal && moderatorId === sid && currentIssueId) {
                if (members.every((u: any) => !!u[`vote_${currentIssueId}`])) {
                    updateRevealStatus(roomId, currentIssueId);
                }
            }
        });

        const usVotes = subscribePointerChanges(roomId, (votes) => {
            const { members, setState: set } = getState();
            const votesMap = getVotesMap(members, votes);
            set({ votes, votesMap });
        });

        function unsubscribe() {
            usRoom();
            usUsers();
            usVotes();
        }

        return unsubscribe;
    }, []);

    const submitVote = useCallback(
        async (vote: number | string) => {
            const { roomId, sid, currentIssueId: issueId, votesMap: map } = state;
            const votesMap = { ...map };
            if (votesMap?.[issueId!]?.reveal) {
                return;
            }

            await updateVote(roomId, sid, issueId!, vote);

            votesMap[issueId!] = { ...votesMap[issueId!], [sid]: vote };
            setState({ votesMap });
        },
        [state, setState],
    );

    const loadAuthInfoFromCache = useCallback(
        async (roomId: string) => {
            if (!roomId) {
                return;
            }

            const data = await loadAuthInfo(roomId);
            if (data) {
                setState(data);
            } else {
                signOutUser();
            }
        },
        [setState],
    );

    const addNewIssue = useCallback(
        async (issue: PokerIssue | string) => {
            if (!issue) {
                return;
            }

            let issueObj: PokerIssue;
            if (typeof issue === 'string') {
                issueObj = { id: generateId(), key: issue };
            } else {
                const { root, key, url, img: icon, summaryText: summary } = issue as any;
                issueObj = { root, id: generateId(), key, url, icon, summary };
            }

            await addIssue(state.roomId, issueObj, false);
        },
        [state.roomId],
    );

    const removeIssue = useCallback(
        async (issueId: string) => {
            const { issues: list, roomId, currentIssueId: cID, viewingIssueId: vID } = state;
            const issues = list.filter((issue) => issue.id !== issueId);

            await updateIssues(roomId, issues, cID === issueId);

            if (vID === issueId) {
                setState({ viewingIssueId: issues[0]?.id });
            }
        },
        [state, setState],
    );

    const selectIssue = useCallback(
        (issueId: string) => {
            setState({ viewingIssueId: issueId });
        },
        [setState],
    );

    const revealVote = useCallback(async () => {
        const { roomId, currentIssueId } = state;
        await updateRevealStatus(roomId, currentIssueId!);
    }, [state]);

    const startEstimation = useCallback(() => {
        const { roomId, viewingIssueId: issueId } = state;
        return beginEstimate(roomId, issueId!, { currentIssueId: issueId });
    }, [state]);

    const restartEstimation = useCallback(() => {
        const { roomId, viewingIssueId: issueId, issues: issuesList } = state;
        const id = generateId();
        const issues = issuesList.map((issue) => (issue.id === issueId ? { ...issue, id } : issue));

        return beginEstimate(roomId, issueId!, { currentIssueId: id, issues });
    }, [state]);

    const exitRoom = useCallback(async () => {
        const { roomId, sid, moderatorId, votesMap, members } = state;
        const isModerator = moderatorId === sid;

        await clearAndExit(
            roomId,
            sid,
            isModerator
                ? {
                      votesList: Object.keys(votesMap),
                      membersList: members.map(({ id }) => id),
                  }
                : undefined,
        );

        if (isModerator) {
            clearSession(isModerator);
        } else {
            closePoker();
        }
    }, [state]);

    const copyUrl = useCallback(() => {
        const roomId = state.roomId;
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(`${JAWebRootUrl}/poker/${roomId}`);
        }
    }, [state.roomId]);

    const setAvatar = useCallback(
        async (avatarId: number | null) => {
            if (typeof avatarId !== 'number') {
                avatarId = null;
            }
            const { roomId, sid } = state;
            await updateAvatar(roomId, sid, avatarId);
        },
        [state],
    );

    const showSettings = useCallback(() => {
        setState({ showConfigs: true });
    }, [setState]);

    const hideSettings = useCallback(() => {
        setState({ showConfigs: false });
    }, [setState]);

    const saveSettings = useCallback(
        (value: any, field: string) => {
            updateRoom(state.roomId, { [field]: value });
        },
        [state.roomId],
    );

    return {
        createRoom,
        joinRoom,
        watchRoom,
        submitVote,
        loadAuthInfoFromCache,
        addNewIssue,
        removeIssue,
        selectIssue,
        revealVote,
        startEstimation,
        restartEstimation,
        exitRoom,
        copyUrl,
        setAvatar,
        showSettings,
        hideSettings,
        saveSettings,
    };
}

function clearSession(isModerator: boolean) {
    signOutUser();
    const msg = `This room is closed${!isModerator ? ' by the moderator' : ''}. Please close this window.`;
    Dialog.alert(msg, 'Room Closed').then(closePoker);
}

function closePoker() {
    clearAuthInfo();
    window.close();
    window.location.href = '/poker';
}
