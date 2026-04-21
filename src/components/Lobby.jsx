import { useEffect, useState, useRef } from 'react';
import { Peer } from 'peerjs';

export default function Lobby() {
    const [peer, setPeer] = useState(null);
    const [myId, setMyId] = useState('');
    const [conn, setConn] = useState(null);
    const [targetId, setTargetId] = useState('');

    const peerInstance = useRef(null);

    useEffect(() => {
        // Only create the peer if it doesn't exist yet
        if (!peerInstance.current) {
            const newPeer = new Peer();

            newPeer.on('open', (id) => {
                console.log('My peer ID is: ' + id);
                setMyId(id);
            });

            newPeer.on('error', (err) => {
                console.error('PeerJS Error:', err.type);
            });

            peerInstance.current = newPeer;
        }

        // Cleanup on unmount
        return () => {
            if (peerInstance.current) {
                peerInstance.current.destroy();
                peerInstance.current = null;
            }
        };
    }, []);

    const joinLobby = () => {
        const newConn = peer.connect(targetId);
        newConn.on('open', () => {
            setConn(newConn);
            newConn.send("Guest has joined!");
        });
        newConn.on('data', (data) => console.log("Received as Guest:", data));
    };

    return (
        <div>
            <h1>My ID: {myId}</h1>
            <input onChange={(e) => setTargetId(e.target.value)} placeholder="Enter Host ID" />
            <button onClick={joinLobby}>Join</button>
        </div>
    );
}