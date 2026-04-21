function HomeScreen({
  playerName,
  roomInput,
  onPlayerNameChange,
  onRoomInputChange,
  onCreateRoom,
  onJoinRoom,
}) {
  return (
    <section className="aq-panel">
      <div className="aq-panel-icons">
        <span className="aq-icon-box" />
        <span className="aq-icon-box" />
        <span className="aq-icon-box" />
        <span className="aq-icon-box" />
      </div>
      <p className="aq-kicker">Party Game</p>
      <div className="aq-hero-card">
        <h2>One room. One imposter. One strange answer.</h2>
      </div>
      <p className="aq-subtle">Create a room or join with a code.</p>

      <div className="aq-form">
        <input
          className="aq-input"
          value={playerName}
          onChange={(event) => onPlayerNameChange(event.target.value)}
          placeholder="Your name"
        />
        <input
          className="aq-input"
          value={roomInput}
          onChange={(event) => onRoomInputChange(event.target.value.toUpperCase())}
          placeholder="Room code (for join)"
          maxLength={6}
        />
      </div>

      <div className="aq-actions aq-actions-center">
        <button className="aq-btn aq-btn-primary" onClick={onCreateRoom}>
          Create Room
        </button>
        <button className="aq-btn aq-btn-ghost" onClick={onJoinRoom}>
          Join by Code
        </button>
      </div>
    </section>
  );
}

export default HomeScreen;
