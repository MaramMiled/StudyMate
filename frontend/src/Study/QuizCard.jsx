import React from "react";

export default function QuizCard({
    question,
    index,
    answer,
    selectAnswer,
    type
}) {

    return (
        <div
            style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: 18,
                marginBottom: 15
            }}
        >

            <div
                style={{
                    fontWeight: 600,
                    marginBottom: 15,
                    fontSize: 14
                }}
            >
                {index + 1}. {question.question}
            </div>
            {q.type === "mcq" && q.options.map(option => (
<button
 key={option}
 onClick={() => selectAnswer(index, option)}
>
○ {option}
</button>
))}

{q.type === "truefalse" && (
<div>
 {["True","False"].map(option=>(
<button
 key={option}
 onClick={()=>selectAnswer(index,option)}
>
{option}
</button>
 ))}
</div>
)}

{q.type === "open" && (
<textarea
value={answers[index] || ""}
onChange={(e)=>selectAnswer(index,e.target.value)}
/>
)}

{q.type === "fill" && (
<input
placeholder="Fill the blank"
value={answers[index] || ""}
onChange={(e)=>selectAnswer(index,e.target.value)}
/>
)}

{q.type==="flashcards" && (
<button
onClick={()=>{
 alert(q.answer)
}}
>
Show answer
</button>
)}


            {/* Multiple choice */}
            {question.options && question.options.length > 0 && (
                <div>
                    {question.options.map(option => (
                        <button
                            key={option}
                            onClick={() => selectAnswer(index, option)}
                            style={{
                                width: "100%",
                                textAlign: "left",
                                padding: "10px",
                                marginBottom: 8,
                                borderRadius: 10,
                                border:
                                    answer === option
                                        ? "1px solid var(--accent-purple)"
                                        : "1px solid var(--border)",
                                background:
                                    answer === option
                                        ? "rgba(167,139,250,0.1)"
                                        : "transparent"
                            }}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            )}


            {/* True / False */}
            {type === "truefalse" && (
                <div>
                    {["True", "False"].map(option => (
                        <button
                            key={option}
                            onClick={() => selectAnswer(index, option)}
                            style={{
                                padding: "10px 20px",
                                marginRight: 10,
                                borderRadius: 10,
                                border:
                                    answer === option
                                        ? "1px solid var(--accent-purple)"
                                        : "1px solid var(--border)"
                            }}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            )}


            {/* Open questions */}
            {type === "open" && (
                <textarea
                    value={answer || ""}
                    onChange={(e) => selectAnswer(index, e.target.value)}
                    placeholder="Your answer..."
                    style={{
                        width: "100%",
                        minHeight: 80,
                        padding: 10,
                        borderRadius: 10
                    }}
                />
            )}


            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 15
                }}
            >

                <button
                    disabled={currentQuestion === 0}
                    onClick={() =>
                        setCurrentQuestion(prev => prev - 1)
                    }
                >
                    ← Previous
                </button>


                <div>
                    {currentQuestion + 1} / {quiz.questions.length}
                </div>


                <button
                    disabled={!answers[currentQuestion]}
                    onClick={() =>
                        setCurrentQuestion(prev => prev + 1)
                    }
                >
                    {
                        currentQuestion === quiz.questions.length - 1
                            ? "Finish"
                            : "Next →"
                    }
                </button>

            </div>

        </div>
    );
}