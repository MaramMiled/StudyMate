import React, { useState } from 'react';

const quizTypes = [
  { id: 'mcq', label: 'Multiple Choice' },
  { id: 'truefalse', label: 'True / False' },
  { id: 'open', label: 'Open Questions' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'fill', label: 'Fill in the Blanks' },
];

const difficulties = ['Easy', 'Medium', 'Hard'];
const difficultyColors = ['var(--accent-green)', 'var(--accent-amber)', 'var(--accent-red)'];

export default function QuizSection({ hasFiles, documentId }) {
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

  quiz.questions.forEach((q,index)=>{
    if(answers[index] === q.answer){
      score++;
    }
  });

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

      console.log("QUIZ DATA:", data);

      setQuiz(data);

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

      {!hasFiles && (
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8, textAlign: 'center' }}>
          Add sources to generate quizzes
        </p>
      )}

      {quiz && !loading && (
        <div style={{
          marginTop: 12,
          padding: '12px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 12.5,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
        }}>

          <div style={{
            fontWeight: 600,
            color: 'var(--accent-green)',
            marginBottom: 10
          }}>
            ✓ Quiz generated
          </div>


          {quiz.questions.map((q, index) => (
            <div
              key={index}
              style={{
                marginBottom: 20,
                paddingBottom: 15,
                borderBottom: "1px solid var(--border)"
              }}
            >

              <strong>
                {index + 1}. {q.question}
              </strong>


              {/* MCQ */}
              {q.options && q.options.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  {q.options.map(option => (
                    <button
                      key={option}
                      onClick={() => selectAnswer(index, option)}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        marginBottom: 6,
                        padding: "8px",
                        borderRadius: 8,
                        border:
                          answers[index] === option
                            ? "1px solid var(--accent-purple)"
                            : "1px solid var(--border)",
                        background:
                          answers[index] === option
                            ? "rgba(167,139,250,0.08)"
                            : "transparent"
                      }}
                    >
                      ○ {option}
                    </button>
                  ))}
                </div>
              )}


              {/* True / False */}
              {selectedType === "truefalse" && (
                <div style={{ marginTop: 10 }}>
                  {["True", "False"].map(option => (
                    <button
                      key={option}
                      onClick={() => selectAnswer(index, option)}
                      style={{
                        marginRight: 8,
                        padding: "8px 15px",
                        borderRadius: 8,
                        border: "1px solid var(--border)"
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}


              {/* Open questions */}
              {selectedType === "open" && (
                <textarea
                  value={answers[index] || ""}
                  onChange={(e) =>
                    selectAnswer(index, e.target.value)
                  }
                  placeholder="Your answer..."
                  style={{
                    width: "100%",
                    marginTop: 10,
                    minHeight: 70
                  }}
                />
              )}

            </div>
          ))}
        <button
          onClick={submitQuiz}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 20,
            background: "var(--accent-green)"
          }}
        >
          Submit Quiz
        </button>

        </div>
      )}

    </div>
  );
}