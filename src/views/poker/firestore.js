
import { initializeApp } from "firebase/app";
import {
    getFirestore, collection, doc, setDoc,
    writeBatch, query, updateDoc, where, onSnapshot,
    serverTimestamp, arrayUnion, deleteDoc
} from "firebase/firestore";
import { getAuth, signInWithCustomToken, signOut } from "firebase/auth";
import config from './firebase.json';

const dbName = 'poker';
const membersCollectionName = 'members';
const votesCollectionName = 'votes';

// Initialize Firebase
const pockerApp = initializeApp(config);
const auth = getAuth();
const db = getFirestore(pockerApp);
//const pokerDB = collection(db, dbName);

export async function insertRoomRecord(state) {
    const { roomId, roomName, sid, token, scoreType } = state;
    const now = new Date().getTime();
    const roomInfo = {
        roomName,
        scoreType,
        moderatorId: sid,
        autoReveal: false,
        showHalfScore: parseInt(scoreType) === 2,
        created: now,
        currentIssueId: null,
        lastActivity: serverTimestamp(),
        timer: 0,
        waitingRoom: false,
        issues: []
    };

    await signinWithToken(token);
    await insertRecord(roomInfo, roomId);
    return await insertUserRecord(roomId, state);
}

async function insertRecord(data, ...path) {
    const docRoomRef = doc(db, dbName, ...path);
    return await setDoc(docRoomRef, data);
}

export async function joinAsMember({ token, roomId }, user) {
    await signinWithToken(token);
    return await insertUserRecord(roomId, user);
}

async function insertUserRecord(roomId, state) {
    //const colUserList = collection(docRoomRef, membersCollectionName);
    const { email = null, sid, name, avatarUrl = null } = state;
    const data = {
        id: sid,
        name,
        email,
        avatarUrl
    };
    //const docUser = await addDoc(colUserList, );
    await insertRecord(data, roomId, membersCollectionName, sid);
    return true;
}

export async function updateAvatar(roomId, sid, avatarId) {
    const docMemberRef = doc(db, dbName, roomId, membersCollectionName, sid);
    return await updateDoc(docMemberRef, { avatarId });
}

export function subscribeRoomChanges(roomId, callback) {
    return subscribe(doc(db, dbName, roomId), callback);
}

export function subscribeUserChanges(roomId, callback) {
    return subscribe(collection(db, dbName, roomId, membersCollectionName), callback);
}

export function subscribePointerChanges(roomId, callback) {
    const col = collection(db, dbName, roomId, votesCollectionName);
    return subscribe(query(col, where("reveal", "==", true)), callback);
}

async function signinWithToken(token) {
    await signInWithCustomToken(auth, token);
}

export async function signOutUser() {
    await signOut(auth);
}

function subscribe(q, callback) {
    return onSnapshot(q, snapshot => {
        let data;
        if (typeof snapshot.data === 'function') {
            data = { id: snapshot.id, ...snapshot.data() };
        } else if (typeof snapshot.forEach === 'function') {
            data = [];
            snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
        }

        callback(data, snapshot.metadata.hasPendingWrites);
    });
}

export async function updateVote(roomId, sid, issueId, vote) {
    const batch = writeBatch(db);

    // Update the vote for specific issue
    const docVotes = doc(db, dbName, roomId, votesCollectionName, issueId);
    batch.update(docVotes, { [sid]: vote });

    // Update the voting status of current issue
    const docSelf = doc(db, dbName, roomId, membersCollectionName, sid);
    batch.update(docSelf, { [`vote_${issueId}`]: true });

    await batch.commit();
}

export async function updateRevealStatus(roomId, issueId) {
    const docRef = doc(db, dbName, roomId, votesCollectionName, issueId);
    return await updateDoc(docRef, { reveal: true });
}

export async function addIssue(roomId, issue, setAsCurrent) {
    const data = {
        issues: arrayUnion(issue)
    };

    if (setAsCurrent) {
        data.currentIssueId = issue.id;
    }

    await updateRoom(roomId, data);
}

export async function updateRoom(roomId, data) {
    const docRef = doc(db, dbName, roomId);
    await updateDoc(docRef, data);
}

export async function updateIssues(roomId, issues, clearCurrent) {
    const data = { issues };
    if (clearCurrent) {
        data.currentIssueId = null;
    }

    await updateRoom(roomId, data);
}

export async function beginEstimate(roomId, issueId, room) {
    const batch = writeBatch(db);

    // Update the vote for specific issue
    const docRoom = doc(db, dbName, roomId);
    batch.update(docRoom, room);


    batch.delete(doc(db, dbName, roomId, votesCollectionName, issueId));
    const docVote = doc(db, dbName, roomId, votesCollectionName, room.currentIssueId);
    batch.set(docVote, { id: room.currentIssueId, reveal: false });

    // update all the users to clear estimates

    await batch.commit();
}

export async function clearAndExit(roomId, sid, subCollections) {
    if (subCollections) {
        const batch = writeBatch(db);

        subCollections.votesList.forEach(v =>
            batch.delete(doc(db, dbName, roomId, votesCollectionName, v))
        );

        subCollections.membersList.forEach(m =>
            batch.delete(doc(db, dbName, roomId, membersCollectionName, m))
        );

        // Delete the room data
        batch.delete(doc(db, dbName, roomId));

        await batch.commit();
    } else {
        await deleteDoc(doc(db, dbName, roomId, membersCollectionName, sid));
    }

    await signOutUser();
}

/*
function signInUser() {
    return new Promise((resolve, reject) => {
        const auth = getAuth();
        onAuthStateChanged(auth, (user, b) => {
            debugger;
            if (!user) { return; }
            const roomId = UUID.generate().replace(/-/g, '').substring(0, 10);
            resolve({ success: true, sid: user.uid, roomId });
        });

        signInAnonymously(auth).catch(reject);
    });
}*/