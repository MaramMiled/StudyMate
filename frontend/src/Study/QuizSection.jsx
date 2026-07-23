import React, { useState } from 'react';
import QuizModal from "../components/QuizModal";
import QuizCard from "./QuizCard";

const quizTypes = [
 { id:'multiple_choice', label:'Multiple Choice'},
 { id:'true_false', label:'True / False'},
 { id:'open_question', label:'Open Questions'},
 { id:'flashcard', label:'Flashcards'},
 { id:'fill_blank', label:'Fill in the Blanks'},
];

const difficulties = ['Easy', 'Medium', 'Hard'];
const difficultyColors = ['var(--accent-green)', 'var(--accent-amber)', 'var(--accent-red)'];

export default function QuizSection({ hasFiles, documentId }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [difficulty, setDifficulty] = useState(1);
  const [numQuestions, setNumQuestions] = useState(10);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [quiz, setQuiz] = useState(null);

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const selectAnswer = (index, answer) => {
    setAnswers(prev => ({
      ...prev,
      [index]: answer
    }));
  };

const submitQuiz = async () => {

  let score = 0;

<QuizCard
  question={quiz.questions[currentQuestion]}
  index={currentQuestion}
  answer={answers[currentQuestion]}
  selectAnswer={selectAnswer}
  type={selectedType}
/>

  console.log("SCORE:", score);

  try {

    const res = await fetch(
      "http://localhost:5000/quizzes/submit",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quiz_id: quiz.quiz_id,
          answers,
          score
        })
      }
    );

    const data = await res.json();

    console.log("SUBMIT RESULT:", data);

    setSubmitted(true);

  } catch(err) {
    console.error("SUBMIT ERROR:", err);
  }

};

  const handleGenerate = async () => {
    if (!selectedType || !hasFiles || !documentId) return;

    setLoading(true);
    setQuiz(null);

    try {
      const res = await fetch(
        `http://localhost:5000/documents/${documentId}/quiz`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            difficulty: difficulties[difficulty].toLowerCase(),
            number: numQuestions,
            type: selectedType,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      console.log(
  "QUESTIONS:",
  JSON.stringify(data.questions, null, 2)
);

      setQuiz(data);
      setCurrentQuestion(0);
      setAnswers({});
      setShowQuiz(true);

    } catch (err) {
      console.error("QUIZ ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        {quizTypes.map(type => (
          <button
            key={type.id}
            onClick={() => { setSelectedType(type.id); setGenerated(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${selectedType === type.id ? 'var(--accent-purple)' : 'var(--border)'}`,
              background: selectedType === type.id ? 'rgba(167,139,250,0.08)' : 'var(--bg-card)',
              transition: 'all 0.12s',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 15 }}></span>
            <span style={{
              fontSize: 13, fontWeight: 500,
              color: selectedType === type.id ? 'var(--accent-purple)' : 'var(--text-primary)',
            }}>
              {type.label}
            </span>
          </button>
        ))}
      </div>


      {/* Number of questions */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)' }}>Questions</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {[5, 10, 15, 20].map(n => (
              <button
                key={n}
                onClick={() => setNumQuestions(n)}
                style={{
                  width: 30, height: 24,
                  fontSize: 11.5,
                  fontWeight: 500,
                  borderRadius: 6,
                  border: `1px solid ${numQuestions === n ? 'var(--accent-purple)' : 'var(--border)'}`,
                  background: numQuestions === n ? 'rgba(167,139,250,0.08)' : 'transparent',
                  color: numQuestions === n ? 'var(--accent-purple)' : 'var(--text-tertiary)',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={!selectedType || !hasFiles || loading}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: 99,
          background: selectedType && hasFiles && !loading ? 'var(--accent-purple)' : 'var(--bg-elevated)',
          color: selectedType && hasFiles && !loading ? '#1B1C1F' : 'var(--text-tertiary)',
          fontSize: 13,
          fontWeight: 600,
          cursor: selectedType && hasFiles && !loading ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
      >
        {loading ? (
          <>
            <div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#1B1C1F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Building quiz…
          </>
        ) : 'Generate quiz'}
      </button>

{submitted && (
<div>
 Score:
 {
 Math.round(
 Object.keys(answers).filter(
 index=>answers[index]===quiz.questions[index].answer
 ).length
 /
 quiz.questions.length
 *100
 )
 }%
</div>
)}

      {!hasFiles && (
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8, textAlign: 'center' }}>
          Add sources to generate quizzes
        </p>
      )}

      {showQuiz && (
  <QuizModal
    quiz={quiz}
    onClose={() => setShowQuiz(false)}
  />
)}

    </div>
  );
}