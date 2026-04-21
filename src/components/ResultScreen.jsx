function ResultScreen({ imposterName, isHost, onBackToLobby, onPlayAgain, players, votes }) {
  const voteCounts = players.reduce((accumulator, player) => {
    accumulator[player.id] = 0;
    return accumulator;
  }, {});

  Object.values(votes).forEach((targetId) => {
    if (voteCounts[targetId] !== undefined) {
      voteCounts[targetId] += 1;
    }
  });

  const topPlayerId = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const votedOutName = players.find((player) => player.id === topPlayerId)?.name || 'No one';
  const imposterCaught = votedOutName === imposterName;

  return (
    <section className="aq-panel aq-center">
      <p className="aq-kicker">Round Result</p>
      <h2>Imposter was {imposterName || 'Unknown'}</h2>
      <p className="aq-subtle">
        Most votes: {votedOutName}. {imposterCaught ? 'Imposter caught.' : 'Imposter escaped.'}
      </p>
      <div className="aq-actions">
        {isHost && (
          <button className="aq-btn aq-btn-ghost" onClick={onBackToLobby}>
            Back to Lobby
          </button>
        )}
        {isHost && (
          <button className="aq-btn aq-btn-primary" onClick={onPlayAgain}>
            Play Again
          </button>
        )}
      </div>
    </section>
  );
}

export default ResultScreen;
