import { useEffect, useState } from 'react';

function AnswerScreen({
  isHost,
  ownQuestion,
  ownAnswer,
  answers,
  players,
  onAnswerChange,
  onSubmitAnswer,
  onContinue,
  canContinue,
}) {
  const [typedQuestion, setTypedQuestion] = useState('');
  const submittedCount = players.filter((player) => Boolean(answers[player.id]?.submitted)).length;

  useEffect(() => {
    let index = 0;
    setTypedQuestion('');
    const timer = window.setInterval(() => {
      index += 1;
      setTypedQuestion(ownQuestion.slice(0, index));
      if (index >= ownQuestion.length) {
        window.clearInterval(timer);
      }
    }, 26);

    return () => window.clearInterval(timer);
  }, [ownQuestion]);

  return (
    <section className="aq-panel">
      <p className="aq-kicker">Answer Phase</p>
      <h2>Write your answer</h2>

      <div className="aq-question-banner">
        <span className="aq-question-label">Your Question</span>
        <p className="aq-typed">{typedQuestion}</p>
      </div>

      <textarea
        className="aq-textarea"
        placeholder="Type your answer..."
        value={ownAnswer}
        onChange={(event) => onAnswerChange(event.target.value)}
        maxLength={180}
      />

      <div className="aq-actions">
        <button className="aq-btn aq-btn-primary" onClick={onSubmitAnswer} disabled={!ownAnswer.trim()}>
          Submit Answer
        </button>
        {isHost && (
          <button className="aq-btn aq-btn-ghost" onClick={onContinue} disabled={!canContinue}>
            Reveal Answers
          </button>
        )}
      </div>

      <p className="aq-subtle">
        Submitted: {submittedCount}/{players.length}
      </p>
    </section>
  );
}

export default AnswerScreen;
