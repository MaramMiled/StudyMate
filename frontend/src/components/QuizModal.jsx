import React, { useState } from "react";
import QuizQuestion from "./QuizQuestion";

export default function QuizModal({ quiz, onClose }) {
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [finished, setFinished] = useState(false);
  const selectAnswer = (answer) => {
  setAnswers(prev => ({
    ...prev,
    [currentQuestion]: answer
  }));
};

  if (!quiz) return null;

  if (finished) {
  const score = quiz.questions.reduce((total, q, index) => {
    return answers[index] === q.answer
      ? total + 1
      : total;
  }, 0);

  return (
    <div
      style={{
        position:"fixed",
        inset:0,
        background:"rgba(0,0,0,0.65)",
        display:"flex",
        justifyContent:"center",
        alignItems:"center",
        zIndex:1000,
      }}
    >

      <div
        style={{
          width:"500px",
          background:"var(--bg-card)",
          padding:"30px",
          borderRadius:"20px",
          textAlign:"center"
        }}
      >

        <h2>Quiz Finished</h2>

        <p style={{fontSize:18}}>
          Your score:
        </p>

        <strong style={{fontSize:32}}>
          {score} / {quiz.questions.length}
        </strong>

        <br/>

        <button
          style={{marginTop:20}}
          onClick={onClose}
        >
          Close
        </button>

      </div>

    </div>
  );
}

  const question = quiz.questions?.[currentQuestion];

if (!question) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >

      <div
        style={{
          width: "700px",
          maxWidth: "90%",
          background: "var(--bg-card)",
          borderRadius: "20px",
          padding: "25px",
          border: "1px solid var(--border)",
        }}
      >

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >

          <strong>
            Quiz
          </strong>

          <button onClick={onClose}>
            ✕
          </button>

        </div>


        {/* Progress */}
        <div style={{marginBottom:20}}>

  <div style={{
    fontSize:13,
    marginBottom:8,
    color:"var(--text-secondary)"
  }}>
    Question {currentQuestion + 1} / {quiz.questions.length}
  </div>


  <div
    style={{
      height:8,
      background:"var(--border)",
      borderRadius:10,
      overflow:"hidden"
    }}
  >

    <div
      style={{
        height:"100%",
        width:`${((currentQuestion+1)/quiz.questions.length)*100}%`,
        background:"var(--accent-purple)",
        transition:"0.3s"
      }}
    />

  </div>

</div>


        {/* Question */}
        <h2 style={{fontSize:22}}>
          {question.question}
        </h2>


        {/* Temporary options */}
<QuizQuestion
  question={question}
  selectedAnswer={answers[currentQuestion]}
  onAnswer={(answer)=>{
    setAnswers(prev=>({
      ...prev,
      [currentQuestion]: answer
    }))
  }}
/>


        {/* Navigation */}
        <div
          style={{
            display:"flex",
            justifyContent:"space-between",
            marginTop:30
          }}
        >

<button
onClick={() => {

 if(currentQuestion === quiz.questions.length - 1){
   setFinished(true);
 }
 else {
   setCurrentQuestion(prev => prev + 1);
 }

}}
>
{
 currentQuestion === quiz.questions.length - 1
 ? "Finish"
 : "Next →"
}
</button>


        </div>


      </div>

    </div>
  );
}