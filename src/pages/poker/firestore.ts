import { addHours } from 'date-fns';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signOut } from 'firebase/auth';
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    writeBatch,
    query,
    updateDoc,
    where,
    onSnapshot,
    serverTimestamp,
    arrayUnion,
    deleteDoc,
    getDoc,
} from 'firebase/firestore';

import config from './firebase.json';

const dbName = 'poker';
const membersCollectionName = 'members';
const votesCollectionName = 'votes';

const pokerApp = initializeApp(config, 'poker');
const auth = getAuth(pokerApp);
const db = getFirestore(pokerApp);

export async function insertRoomRecord(state: any) {
    const { roomId, roomName, sid, token, scoreType } = state;
    const now = new Date().getTime();
    const roomInfo = {
        roomName,
        scoreType: parseInt(scoreType),
        moderatorId: sid,
        autoReveal: false,
        showHalfScore: parseInt(scoreType) === 2,
        created: now,
        currentIssueId: null,
        lastActivity: serverTimestamp(),
        exp: addHours(new Date(), 12),
        timer: 0,
        waitingRoom: false,
        issues: [],
    };

    await signInWithToken(token);
    await insertRecord(roomInfo, roomId);
    return await insertUserRecord(roomId, state);
}

async function insertRecord(data: any, ...path: string[]) {
    const docRoomRef = doc(db, dbName, ...path);
    return await setDoc(docRoomRef, data);
}

export async function joinAsMember({ token, roomId }: any, user: any) {
    await signInWithToken(token);
    const roomRecord = await getDoc(doc(db, dbName, roomId));
    const data = roomRecord.data();
    if (!data) {
        await signOutUser();
        return { field: 'roomError', error: 'Invalid room id or the room is already closed' };
    }
    return await insertUserRecord(roomId, user);
}

async function insertUserRecord(roomId: string, state: any) {
    const { email = null, sid, name, avatarUrl = null } = state;
    const data = {
        id: sid,
        name,
        email,
        avatarUrl,
    };
    await insertRecord(data, roomId, membersCollectionName, sid);
    return true;
}

export async function updateAvatar(roomId: string, sid: string, avatarId: number | null) {
    const docMemberRef = doc(db, dbName, roomId, membersCollectionName, sid);
    return await updateDoc(docMemberRef, { avatarId });
}

export function subscribeRoomChanges(roomId: string, callback: (data: any) => void) {
    return subscribe(doc(db, dbName, roomId), callback);
}

export function subscribeUserChanges(roomId: string, callback: (data: any) => void) {
    return subscribe(collection(db, dbName, roomId, membersCollectionName), callback);
}

export function subscribePointerChanges(roomId: string, callback: (data: any) => void) {
    const col = collection(db, dbName, roomId, votesCollectionName);
    return subscribe(query(col, where('reveal', '==', true)), callback);
}

async function signInWithToken(token: string) {
    await signInWithCustomToken(auth, token);
}

export async function signOutUser() {
    await signOut(auth);
}

function subscribe(q: any, callback: (data: any, hasPendingWrites?: boolean) => void) {
    return onSnapshot(q, (snapshot: any) => {
        let data;
        if (typeof snapshot.data === 'function') {
            data = { id: snapshot.id, ...snapshot.data() };
        } else if (typeof snapshot.forEach === 'function') {
            data = [];
            snapshot.forEach((doc: any) => data.push({ id: doc.id, ...doc.data() }));
        }

        callback(data, snapshot.metadata.hasPendingWrites);
    });
}

export async function updateVote(roomId: string, sid: string, issueId: string, vote: number | string) {
    const batch = writeBatch(db);

    const docVotes = doc(db, dbName, roomId, votesCollectionName, issueId);
    batch.update(docVotes, { [sid]: vote });

    const docSelf = doc(db, dbName, roomId, membersCollectionName, sid);
    batch.update(docSelf, { [`vote_${issueId}`]: true });

    await batch.commit();
}

export async function updateRevealStatus(roomId: string, issueId: string) {
    const docRef = doc(db, dbName, roomId, votesCollectionName, issueId);
    return await updateDoc(docRef, { reveal: true });
}

export async function addIssue(roomId: string, issue: any, setAsCurrent: boolean) {
    const data: any = {
        issues: arrayUnion(issue),
    };

    if (setAsCurrent) {
        data.currentIssueId = issue.id;
    }

    await updateRoom(roomId, data);
}

export async function updateRoom(roomId: string, data: any) {
    const docRef = doc(db, dbName, roomId);
    await updateDoc(docRef, data);
}

export async function updateIssues(roomId: string, issues: any[], clearCurrent: boolean) {
    const data: any = { issues };
    if (clearCurrent) {
        data.currentIssueId = null;
    }

    await updateRoom(roomId, data);
}

export async function beginEstimate(roomId: string, issueId: string, room: any) {
    const batch = writeBatch(db);

    const docRoom = doc(db, dbName, roomId);
    batch.update(docRoom, room);

    batch.delete(doc(db, dbName, roomId, votesCollectionName, issueId));
    const docVote = doc(db, dbName, roomId, votesCollectionName, room.currentIssueId);
    batch.set(docVote, { id: room.currentIssueId, reveal: false });

    await batch.commit();
}

export async function clearAndExit(roomId: string, sid: string, subCollections?: { votesList: string[]; membersList: string[] }) {
    if (subCollections) {
        const batch = writeBatch(db);

        subCollections.votesList.forEach((v) => batch.delete(doc(db, dbName, roomId, votesCollectionName, v)));

        subCollections.membersList.forEach((m) => batch.delete(doc(db, dbName, roomId, membersCollectionName, m)));

        batch.delete(doc(db, dbName, roomId));

        await batch.commit();
    } else {
        await deleteDoc(doc(db, dbName, roomId, membersCollectionName, sid));
    }

    await signOutUser();
}
