import { useEffect, useMemo, useState } from 'react';

function DiscussionScreen({ players, userId, votes, onVote, discussionEndsAt }) {
  const [now, setNow] = useState(Date.now());
  const votedCount = useMemo(
    () => players.filter((player) => Boolean(votes[player.id])).length,
    [players, votes],
  );
  const remainingMs = Math.max(0, discussionEndsAt - now);
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const ownVote = votes[userId] || '';

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="aq-panel">
      <p className="aq-kicker">Discussion</p>
      <h2>Discuss and vote now</h2>
      <p className="aq-subtle">
        Time left: {remainingSeconds}s | Votes: {votedCount}/{players.length}
      </p>

      <div className="aq-vote-grid">
        {players.map((player) => (
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
    </section>
  );
}

export default DiscussionScreen;
