function LobbyScreen({ roomCode, players, isHost, onLeave, onStart, onCopyInvite }) {
  return (
    <section className="aq-panel">
      <p className="aq-kicker">Lobby</p>
      <div className="aq-room">
        <h2>Room Code: {roomCode}</h2>
        <button className="aq-chip" onClick={onCopyInvite}>
          Copy Invite Link
        </button>
      </div>
      <div className="aq-list">
        {players.map((player) => (
          <div className="aq-player" key={player.id}>
            <span>{player.name}</span>
            {player.isHost ? <span className="aq-pill">Host</span> : <span className="aq-dot" />}
          </div>
        ))}
      </div>
      <div className="aq-actions">
        <button className="aq-btn aq-btn-ghost" onClick={onLeave}>
          Leave
        </button>
        {isHost && (
          <button className="aq-btn aq-btn-primary" onClick={onStart}>
            Start Game
          </button>
        )}
      </div>
    </section>
  );
}

export default LobbyScreen;
