import { useEffect, useState } from 'react';

function RevealScreen({
  players,
  reveals,
  question,
  isHost,
  revealStep,
  votes,
  userId,
  onVote,
  discussionEndsAt,
}) {
  const [typedQuestion, setTypedQuestion] = useState('');
  const [now, setNow] = useState(Date.now());
  const revealedCount = players.filter((player) => reveals[player.id]).length;
  const allRevealed = players.length > 0 && revealStep >= players.length;
  const votedCount = players.filter((player) => Boolean(votes[player.id])).length;
  const ownVote = votes[userId] || '';
  const orderedPlayers = [...players].sort((a, b) => a.revealIndex - b.revealIndex);
  const remainingMs = Math.max(0, discussionEndsAt - now);
  const remainingSeconds = Math.ceil(remainingMs / 1000);

  useEffect(() => {
    let index = 0;
    setTypedQuestion('');
    const timer = window.setInterval(() => {
      index += 1;
      setTypedQuestion(question.slice(0, index));
      if (index >= question.length) {
        window.clearInterval(timer);
      }
    }, 28);

    return () => window.clearInterval(timer);
  }, [question]);

  useEffect(() => {
    if (!allRevealed) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [allRevealed]);

  return (
    <section className="aq-panel">
      <p className="aq-kicker">Reveal Phase</p>
      <h2>Answer Reveal Board</h2>
      <div className="aq-question-banner">
        <span className="aq-question-label">Question</span>
        <p className="aq-typed">{typedQuestion}</p>
      </div>

      {!allRevealed && (
        <p className="aq-subtle">
          {isHost ? 'Cards reveal automatically every 2 seconds.' : 'Watching automatic reveal...'} {revealedCount}/
          {players.length} shown.
        </p>
      )}

      <div className="aq-grid">
        {orderedPlayers.map((player, index) => (
          <button
            key={player.id}
            type="button"
            className={`aq-card aq-grid-card ${reveals[player.id] ? 'is-flipped' : ''}`}
            disabled
          >
            <span className="aq-card-face aq-card-front">
              <strong>{reveals[player.id] ? `Card ${index + 1}` : `Revealing #${index + 1}`}</strong>
              <small>{player.name}</small>
            </span>
            <span className="aq-card-face aq-card-back">
              <small>{player.name}</small>
              <strong>{player.answer}</strong>
            </span>
          </button>
        ))}
      </div>
      <p className="aq-subtle">Step: {Math.min(revealStep, players.length)}/{players.length}</p>

      {allRevealed && (
        <>
          <p className="aq-subtle">
            Discussion + Voting live: {remainingSeconds}s left | Votes: {votedCount}/{players.length}
          </p>
          <div className="aq-vote-grid">
            {orderedPlayers.map((player) => (
              <button
                key={player.id}
                className={`aq-btn ${ownVote === player.id ? 'aq-btn-primary' : 'aq-btn-ghost'}`}
                onClick={() => onVote(player.id)}
                disabled={player.id === userId}
              >
                Vote {player.name}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default RevealScreen;
