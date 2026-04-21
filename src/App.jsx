import { useEffect, useMemo, useRef, useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { get, onValue, ref, remove, set, update } from 'firebase/database';
import './App.css';
import AnswerScreen from './components/AnswerScreen';
import HomeScreen from './components/HomeScreen';
import LobbyScreen from './components/LobbyScreen';
import ResultScreen from './components/ResultScreen';
import RevealScreen from './components/RevealScreen';
import { questionBank } from './data/questionBank';
import { auth, db } from './firebase';

function generateRoomCode(length = 5) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function shuffleIds(items) {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const STALE_ROOM_MS = 6 * 60 * 60 * 1000;

function App() {
  const [user, setUser] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [roomInput, setRoomInput] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [error, setError] = useState('');
  const [answerDraft, setAnswerDraft] = useState('');
  const wasInAnswerPhaseRef = useRef(false);

  useEffect(() => {
    signInAnonymously(auth)
      .then((credential) => {
        setUser(credential.user);
      })
      .catch(() => {
        setError('Could not sign in anonymously.');
      });
  }, []);

  useEffect(() => {
    if (!roomCode) return undefined;

    const roomRef = ref(db, `rooms/${roomCode}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setRoomData(null);
        setRoomCode('');
        return;
      }
      setRoomData(data);
    });

    return () => unsubscribe();
  }, [roomCode]);

  const players = useMemo(() => {
    const playersObject = roomData?.players || {};
    return Object.entries(playersObject).map(([id, value]) => ({
      id,
      name: value?.name || 'Player',
      isHost: Boolean(value?.isHost),
    }));
  }, [roomData]);

  const reveals = roomData?.reveals || {};
  const answers = roomData?.answers || {};
  const votes = roomData?.votes || {};
  const screen = roomData?.phase || 'home';
  const currentQuestion = roomData?.question || questionBank[0].questions;
  const currentImposterQuestion = roomData?.imposterQuestion || questionBank[0].fakeQuestions;
  const imposterId = roomData?.imposterId || '';
  const revealOrder = roomData?.revealOrder || players.map((player) => player.id);
  const revealStep = roomData?.revealStep || 0;
  const discussionEndsAt = roomData?.discussionEndsAt || 0;
  const isHost = Boolean(user?.uid && roomData?.hostUid === user.uid);
  const allRevealed = players.length > 0 && revealStep >= players.length;
  const allSubmitted = players.length > 0 && players.every((player) => Boolean(answers[player.id]?.submitted));
  const allVoted = players.length > 0 && players.every((player) => Boolean(votes[player.id]));

  const orderIndexById = revealOrder.reduce((accumulator, playerId, index) => {
    accumulator[playerId] = index;
    return accumulator;
  }, {});

  const playersWithAnswer = players.map((player) => ({
    ...player,
    answer: answers[player.id]?.answer || 'No answer submitted.',
    revealIndex: orderIndexById[player.id] ?? Number.MAX_SAFE_INTEGER,
  }));

  const imposterName = players.find((player) => player.id === imposterId)?.name;

  const cleanupStaleRooms = async () => {
    const roomsSnapshot = await get(ref(db, 'rooms'));
    if (!roomsSnapshot.exists()) return;

    const now = Date.now();
    const rooms = roomsSnapshot.val() || {};
    const deletePromises = Object.entries(rooms).flatMap(([code, room]) => {
      const createdAt = room?.createdAt || 0;
      const playersCount = Object.keys(room?.players || {}).length;
      const isStale = createdAt > 0 && now - createdAt > STALE_ROOM_MS;
      if (playersCount === 0 || isStale) {
        return [remove(ref(db, `rooms/${code}`))];
      }
      return [];
    });

    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
    }
  };

  const createRoom = async () => {
    if (!user) {
      setError('Still connecting to Firebase. Try again.');
      return;
    }
    if (!playerName.trim()) {
      setError('Enter your name first.');
      return;
    }
    await cleanupStaleRooms();

    const code = generateRoomCode();
    const roomRef = ref(db, `rooms/${code}`);
    const newRoom = {
      hostUid: user.uid,
      phase: 'lobby',
      question: questionBank[0].questions,
      imposterQuestion: questionBank[0].fakeQuestions,
      imposterId: '',
      createdAt: Date.now(),
      players: {
        [user.uid]: {
          name: playerName.trim(),
          isHost: true,
        },
      },
      reveals: {
        [user.uid]: false,
      },
      answers: {},
      votes: {},
      revealOrder: [],
      revealStep: 0,
      discussionEndsAt: 0,
    };

    await set(roomRef, newRoom);
    setRoomCode(code);
    setRoomInput(code);
    setError('');
  };

  const joinRoom = async () => {
    if (!user) {
      setError('Still connecting to Firebase. Try again.');
      return;
    }
    if (!playerName.trim()) {
      setError('Enter your name first.');
      return;
    }
    if (!roomInput.trim()) {
      setError('Enter a room code.');
      return;
    }
    await cleanupStaleRooms();

    const code = roomInput.trim().toUpperCase();
    const roomRef = ref(db, `rooms/${code}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
      setError('Room not found.');
      return;
    }

    await update(roomRef, {
      [`players/${user.uid}`]: {
        name: playerName.trim(),
        isHost: false,
      },
      [`reveals/${user.uid}`]: false,
      [`answers/${user.uid}`]: { answer: '', submitted: false },
    });

    setRoomCode(code);
    setError('');
  };

  const leaveRoom = async () => {
    if (!user || !roomCode) return;

    await Promise.all([
      remove(ref(db, `rooms/${roomCode}/players/${user.uid}`)),
      remove(ref(db, `rooms/${roomCode}/reveals/${user.uid}`)),
      remove(ref(db, `rooms/${roomCode}/answers/${user.uid}`)),
      remove(ref(db, `rooms/${roomCode}/votes/${user.uid}`)),
    ]);

    const afterLeaveSnapshot = await get(ref(db, `rooms/${roomCode}/players`));
    const remainingPlayers = afterLeaveSnapshot.exists()
      ? Object.keys(afterLeaveSnapshot.val() || {}).length
      : 0;
    if (remainingPlayers === 0) {
      await remove(ref(db, `rooms/${roomCode}`));
    }

    setRoomCode('');
    setRoomData(null);
  };

  const copyInvite = async () => {
    if (!roomCode) return;
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    await navigator.clipboard.writeText(inviteUrl);
  };

  const startGame = async () => {
    if (!isHost || players.length < 2) {
      setError('Need at least 2 players to start.');
      return;
    }

    const pick = players[Math.floor(Math.random() * players.length)];
    const pickedQuestionSet = questionBank[Math.floor(Math.random() * questionBank.length)];
    const shuffledOrder = shuffleIds(players.map((player) => player.id));
    const revealsReset = players.reduce((accumulator, player) => {
      accumulator[player.id] = false;
      return accumulator;
    }, {});
    const answersReset = players.reduce((accumulator, player) => {
      accumulator[player.id] = { answer: '', submitted: false };
      return accumulator;
    }, {});

    await update(ref(db, `rooms/${roomCode}`), {
      phase: 'answer',
      imposterId: pick.id,
      reveals: revealsReset,
      answers: answersReset,
      votes: {},
      question: pickedQuestionSet.questions,
      imposterQuestion: pickedQuestionSet.fakeQuestions,
      revealOrder: shuffledOrder,
      revealStep: 0,
      discussionEndsAt: 0,
    });
    setAnswerDraft('');
    setError('');
  };

  const updatePhase = async (phase) => {
    if (!isHost || !roomCode) return;
    await update(ref(db, `rooms/${roomCode}`), { phase });
  };

  const submitOwnAnswer = async () => {
    if (!user || !roomCode) return;
    const trimmedAnswer = answerDraft.trim();
    if (!trimmedAnswer) return;

    await update(ref(db, `rooms/${roomCode}/answers/${user.uid}`), {
      answer: trimmedAnswer,
      submitted: true,
      updatedAt: Date.now(),
    });
  };

  const submitVote = async (targetPlayerId) => {
    if (!user || !roomCode || screen !== 'reveal' || !allRevealed) return;
    if (!targetPlayerId) return;
    await update(ref(db, `rooms/${roomCode}/votes`), {
      [user.uid]: targetPlayerId,
    });
  };

  const ownQuestion = user?.uid === imposterId ? currentImposterQuestion : currentQuestion;
  const ownAnswer = answerDraft;

  useEffect(() => {
    const enteringAnswer = screen === 'answer' && !wasInAnswerPhaseRef.current;
    if (enteringAnswer) {
      const savedOwnAnswer = user?.uid ? answers[user.uid]?.answer || '' : '';
      setAnswerDraft(savedOwnAnswer);
    }
    wasInAnswerPhaseRef.current = screen === 'answer';
  }, [answers, screen, user]);

  useEffect(() => {
    if (!isHost || !roomCode || screen !== 'reveal') return undefined;
    if (allRevealed) return undefined;

    const timer = window.setInterval(async () => {
      const nextStep = Math.min(revealStep + 1, players.length);
      const revealsFromStep = revealOrder.reduce((accumulator, playerId, index) => {
        accumulator[playerId] = index < nextStep;
        return accumulator;
      }, {});
      await update(ref(db, `rooms/${roomCode}`), {
        revealStep: nextStep,
        reveals: revealsFromStep,
      });
    }, 2000);

    return () => window.clearInterval(timer);
  }, [allRevealed, isHost, players.length, revealOrder, revealStep, roomCode, screen]);

  useEffect(() => {
    if (!isHost || !roomCode || screen !== 'reveal' || !allRevealed) return;
    if (discussionEndsAt) return;

    update(ref(db, `rooms/${roomCode}`), {
      discussionEndsAt: Date.now() + 60000,
    });
  }, [allRevealed, discussionEndsAt, isHost, roomCode, screen]);

  useEffect(() => {
    if (!isHost || !roomCode || screen !== 'reveal' || !allRevealed) return;
    if (allVoted) {
      update(ref(db, `rooms/${roomCode}`), { phase: 'result' });
      return undefined;
    }
    const timer = window.setInterval(() => {
      if (discussionEndsAt && Date.now() >= discussionEndsAt) {
        update(ref(db, `rooms/${roomCode}`), { phase: 'result' });
      }
    }, 500);

    return () => window.clearInterval(timer);
  }, [allRevealed, allVoted, discussionEndsAt, isHost, roomCode, screen]);

  return (
    <main className="aq-shell">
      <header className="aq-topbar">
        <h1>Atomic Question</h1>
        {roomCode ? (
          <span className="aq-badge">{roomCode ? `Room ${roomCode}` : 'helo wrld'}</span>
        ) : 
        null}
      </header>

      {screen === 'home' && (
        <HomeScreen
          playerName={playerName}
          roomInput={roomInput}
          onPlayerNameChange={setPlayerName}
          onRoomInputChange={setRoomInput}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
        />
      )}

      {screen === 'lobby' && (
        <LobbyScreen
          roomCode={roomCode}
          players={players}
          isHost={isHost}
          onLeave={leaveRoom}
          onStart={startGame}
          onCopyInvite={copyInvite}
        />
      )}

      {screen === 'reveal' && (
        <RevealScreen
          players={playersWithAnswer}
          reveals={reveals}
          question={currentQuestion}
          isHost={isHost}
          revealStep={revealStep}
          votes={votes}
          userId={user?.uid || ''}
          onVote={submitVote}
          discussionEndsAt={discussionEndsAt}
        />
      )}

      {screen === 'answer' && (
        <AnswerScreen
          isHost={isHost}
          ownQuestion={ownQuestion}
          ownAnswer={ownAnswer}
          answers={answers}
          players={players}
          onAnswerChange={setAnswerDraft}
          onSubmitAnswer={submitOwnAnswer}
          onContinue={() => updatePhase('reveal')}
          canContinue={allSubmitted}
        />
      )}

      {screen === 'result' && (
        <ResultScreen
          imposterName={imposterName}
          isHost={isHost}
          onBackToLobby={() => updatePhase('lobby')}
          onPlayAgain={startGame}
          players={players}
          votes={votes}
        />
      )}

      {error && <p className="aq-error">{error}</p>}
    </main>
  );
}

export default App;
