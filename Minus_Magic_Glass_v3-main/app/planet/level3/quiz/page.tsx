"use client"
import { useState } from "react"
import Link from "next/link"

export default function QuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)

  const questions = [
    {
      question: "Which shape is used in Edge Detection Round 1?",
      options: ["Circle", "Square", "Rhombus"],
      answer: "Circle",
    },
    {
      question: "Which shape is used in Round 2?",
      options: ["Triangle", "Square", "Hexagon"],
      answer: "Square",
    },
    {
      question: "Which shape is used in Round 3?",
      options: ["Rhombus", "Circle", "Rectangle"],
      answer: "Rhombus",
    },
  ]

  const handleAnswer = (option: string) => {
    if (option === questions[currentQuestion].answer) {
      setScore(score + 1)
    }

    const nextQuestion = currentQuestion + 1
    if (nextQuestion < questions.length) {
      setCurrentQuestion(nextQuestion)
    } else {
      setShowResult(true)
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-6">
      <h1 className="text-3xl font-bold mb-6">Level 3 – Quiz</h1>

      {!showResult ? (
        <>
          <p className="mb-4 text-lg">
            {questions[currentQuestion].question}
          </p>
          <div className="flex flex-col gap-3">
            {questions[currentQuestion].options.map((option) => (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                className="btn btn-outline"
              >
                {option}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Question {currentQuestion + 1} of {questions.length}
          </p>
        </>
      ) : (
        <div className="mt-6">
          <p className="text-xl font-semibold">
            🎉 You scored {score} out of {questions.length}!
          </p>
          <button
            onClick={() => {
              setCurrentQuestion(0)
              setScore(0)
              setShowResult(false)
            }}
            className="btn btn-primary mt-4"
          >
            Retry Quiz
          </button>

          {/* Back to Level 3 button */}
          <Link href="/planet/level3" className="btn btn-outline mt-4">
            ⬅ Back to Level 3
          </Link>
        </div>
      )}
    </main>
  )
}
