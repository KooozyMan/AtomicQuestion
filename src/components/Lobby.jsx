import { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from "firebase/auth";
import { getDatabase, ref, set, onValue, push, onDisconnect } from 'firebase/database';

// Your config (Safe for GitHub)
const firebaseConfig = {
    apiKey: "AIzaSyAMZV7yW55YwGC7uK9SX9Pbpdz56QpUsPg",
    authDomain: "atomicquestion-67678.firebaseapp.com",
    projectId: "atomicquestion-67678",
    storageBucket: "atomicquestion-67678.firebasestorage.app",
    messagingSenderId: "274347417298",
    appId: "1:274347417298:web:b0eb3f82339dd9f33b570b",
    databaseURL: "https://atomicquestion-67678-default-rtdb.europe-west1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export default function Lobby() {
    const [roomName, setRoomName] = useState('');
    const [isHost, setIsHost] = useState(false);
    const [players, setPlayers] = useState([]);
    const [currentRoom, setCurrentRoom] = useState(null);


    useEffect(() => {
        // Sign in anonymously on mount
        signInAnonymously(auth)
            .then(() => {
                console.log("Logged in anonymously!");
            })
            .catch((error) => {
                console.error("Auth failed:", error);
            });
    }, []);

    // --- HOST LOGIC ---
    const createLobby = () => {
        if (!roomName) return alert("Enter a room name!");

        const roomRef = ref(db, 'rooms/' + roomName);
        const hostData = {
            host: "Player 1 (Host)",
            status: 'waiting',
            createdAt: Date.now()
        };

        set(roomRef, hostData).then(() => {
            setIsHost(true);
            setCurrentRoom(roomName);
            listenToRoom(roomName);

            // Cleanup: Delete room if Host closes browser
            onDisconnect(roomRef).remove();
        });
    };

    // --- GUEST LOGIC ---
    const joinLobby = () => {
        if (!roomName) return alert("Enter room name!");

        const playerRef = ref(db, `rooms/${roomName}/players`);
        const newPlayerRef = push(playerRef); // Generates unique ID

        onDisconnect(newPlayerRef).remove();

        set(newPlayerRef, { name: "Guest_" + Math.floor(Math.random() * 1000) })
            .then(() => {
                setCurrentRoom(roomName);
                listenToRoom(roomName);
            });
    };

    // --- SHARED LOGIC ---
    const listenToRoom = (name) => {
        const roomRef = ref(db, 'rooms/' + name);
        onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Convert the players object into an array we can map
                const playerList = data.players ? Object.values(data.players) : [];
                setPlayers(playerList);
            }
        });
    };

    return (
        <div style={{ backgroundColor: '#0B2447', color: 'white', minHeight: '100vh', padding: '40px' }}>
            <h1>{currentRoom ? `Room: ${currentRoom}` : 'Join a Session'}</h1>

            {!currentRoom ? (
                <div>
                    <input
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="Room Name..."
                        style={{ padding: '10px', borderRadius: '4px', border: 'none' }}
                    />
                    <button onClick={createLobby} style={{ margin: '0 10px' }}>Create</button>
                    <button onClick={joinLobby}>Join</button>
                </div>
            ) : (
                <div>
                    <h3>Players in Lobby:</h3>
                    <ul>
                        <li>👑 Host</li>
                        {players.map((p, i) => (
                            <li key={i}>👤 {p.name}</li>
                        ))}
                    </ul>
                    <button onClick={() => window.location.reload()}>Leave Room</button>
                </div>
            )}
        </div>
    );
}