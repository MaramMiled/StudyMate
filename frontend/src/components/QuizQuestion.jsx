import React from "react";

export default function QuizQuestion({
  question,
  selectedAnswer,
  onAnswer
}) {

  // Multiple choice
  if (question.options && question.options.length > 0) {

    return (
      <div>
        {question.options.map(option => (

          <button
            key={option}
            onClick={() => onAnswer(option)}
            style={{
              width:"100%",
              padding:"14px",
              marginTop:10,
              borderRadius:14,
              border:
                selectedAnswer === option
                ? "2px solid var(--accent-purple)"
                : "1px solid var(--border)",
              background:
                selectedAnswer === option
                ? "rgba(167,139,250,0.12)"
                : "transparent",
              textAlign:"left",
              cursor:"pointer"
            }}
          >
            {option}
          </button>

        ))}
      </div>
    );
  }



  // True / False
  if (
    question.type === "true_false"
  ) {

    return (
      <div style={{display:"flex", gap:10}}>

        {["True","False"].map(option => (

          <button
            key={option}
            onClick={() => onAnswer(option)}
            style={{
              flex:1,
              padding:15,
              borderRadius:14,
              border:
                selectedAnswer === option
                ? "2px solid var(--accent-purple)"
                : "1px solid var(--border)"
            }}
          >
            {option}
          </button>

        ))}

      </div>
    );
  }




  // Open questions
  if (
    question.type === "open_question"
  ) {

    return (

      <textarea
        value={selectedAnswer || ""}
        onChange={(e)=>onAnswer(e.target.value)}
        placeholder="Write your answer..."
        style={{
          width:"100%",
          minHeight:120,
          padding:15,
          borderRadius:14
        }}
      />

    );

  }




  // Fill blanks
  if (
    question.type === "fill_blank"
  ){

    return (

      <input
        value={selectedAnswer || ""}
        onChange={(e)=>onAnswer(e.target.value)}
        placeholder="Complete the answer..."
        style={{
          width:"100%",
          padding:14,
          borderRadius:14
        }}
      />

    );

  }




  // Flashcards
  if (
    question.type === "flashcard"
  ){

    return (

      <div
        onClick={()=>{
          onAnswer(
            selectedAnswer ? null : question.answer
          )
        }}
        style={{
          padding:30,
          borderRadius:20,
          border:"1px solid var(--border)",
          cursor:"pointer",
          textAlign:"center"
        }}
      >

        {selectedAnswer
          ? question.answer
          : "Click to reveal answer"}

      </div>

    );

  }


  return null;
}